import { prisma } from "@backend/lib/prisma";
import { env } from "@backend/config/env";
import { getCalendarClient } from "./calendar-client.factory";
import { hashWebhookToken } from "@backend/lib/encryption";
import { performIncrementalSync } from "./google-incremental-sync.service";
import crypto from "crypto";

export class WebhookValidationError extends Error {
  constructor(
    message: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = "WebhookValidationError";
  }
}

/**
 * Registers a push notification watch channel with Google Calendar (max 7 days validity)
 */
export async function registerCalendarWatchChannel(connectionId: string) {
  const webhookUrl = env.GOOGLE_CALENDAR_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[GoogleWebhook] GOOGLE_CALENDAR_WEBHOOK_URL is not set. Skipping watch registration.");
    return null;
  }

  const { calendar, selectedCalendarId } = await getCalendarClient(connectionId);

  const channelId = `pawcare-${connectionId}-${Date.now()}`;
  const verificationToken = env.GOOGLE_CALENDAR_WEBHOOK_TOKEN || crypto.randomBytes(32).toString("hex");
  const verificationTokenHash = hashWebhookToken(verificationToken);

  // 7 days in milliseconds
  const ttlMs = 7 * 24 * 60 * 60 * 1000;
  const expirationAt = new Date(Date.now() + ttlMs);

  const response = await calendar.events.watch({
    calendarId: selectedCalendarId,
    requestBody: {
      id: channelId,
      type: "web_hook",
      address: webhookUrl,
      token: verificationToken,
      params: {
        ttl: String(Math.floor(ttlMs / 1000)),
      },
    },
  });

  const resourceId = response.data.resourceId;
  if (!resourceId) {
    throw new Error("Google Calendar watch did not return a resourceId.");
  }

  // Deactivate any old active channels for this connection
  await prisma.calendarWebhookChannel.updateMany({
    where: {
      calendarConnectionId: connectionId,
      status: "ACTIVE",
    },
    data: {
      status: "STOPPED",
    },
  });

  return prisma.calendarWebhookChannel.create({
    data: {
      calendarConnectionId: connectionId,
      channelId,
      resourceId,
      verificationTokenHash,
      expirationAt,
      status: "ACTIVE",
    },
  });
}

/**
 * Stops an active push notification watch channel
 */
export async function stopCalendarWatchChannel(channelId: string) {
  const channel = await prisma.calendarWebhookChannel.findUnique({
    where: { channelId },
  });

  if (!channel || channel.status !== "ACTIVE") {
    return;
  }

  try {
    const { calendar } = await getCalendarClient(channel.calendarConnectionId);
    await calendar.channels.stop({
      requestBody: {
        id: channel.channelId,
        resourceId: channel.resourceId,
      },
    });
  } catch (err) {
    console.warn(`[GoogleWebhook] Failed to stop remote channel ${channelId}:`, err);
  }

  await prisma.calendarWebhookChannel.updateMany({
    where: { id: channel.id },
    data: { status: "STOPPED" },
  });
}

/**
 * Validates incoming Google push notification headers and dispatches incremental sync
 */
export async function processGoogleWebhook(headers: {
  channelId?: string;
  resourceId?: string;
  resourceState?: string;
  channelToken?: string;
}) {
  const { channelId, resourceId, resourceState, channelToken } = headers;

  if (!channelId || !resourceId || !resourceState) {
    throw new WebhookValidationError("Header webhook Google tidak lengkap.");
  }

  // Find registered channel
  const channel = await prisma.calendarWebhookChannel.findUnique({
    where: { channelId },
  });

  if (!channel) {
    throw new WebhookValidationError("Channel ID tidak terdaftar.", 404);
  }

  // Verify verification token hash if configured with timing-safe comparison
  if (channelToken) {
    const computedHash = hashWebhookToken(channelToken);
    const computedBuf = Buffer.from(computedHash, "utf8");
    const expectedBuf = Buffer.from(channel.verificationTokenHash, "utf8");
    if (
      computedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(computedBuf, expectedBuf)
    ) {
      throw new WebhookValidationError("Token verifikasi webhook tidak valid.", 403);
    }
  }

  // If resourceState is 'sync', this is Google's handshake message upon channel creation
  if (resourceState === "sync") {
    return {
      success: true,
      action: "HANDSHAKE_CONFIRMED",
    };
  }

  // If resourceState is 'exists', trigger incremental sync immediately
  if (resourceState === "exists") {
    const syncResult = await performIncrementalSync({
      connectionId: channel.calendarConnectionId,
    });

    return {
      success: true,
      action: "SYNC_COMPLETED",
      details: syncResult,
    };
  }

  return {
    success: true,
    action: "IGNORED",
  };
}
