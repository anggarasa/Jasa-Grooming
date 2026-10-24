import { prisma } from "@/lib/prisma";
import { createOAuth2Client } from "./google-oauth.service";
import { decrypt } from "@/lib/encryption";
import { stopCalendarWatchChannel } from "./google-webhook.service";

/**
 * Disconnects the Google Calendar connection securely:
 * - Revokes OAuth tokens at Google servers
 * - Stops active webhook watch channels
 * - Securely wipes encrypted access and refresh tokens
 * - Clears external busy interval caches
 * - Retains booking history and audit logs intact
 */
export async function disconnectGoogleAccount(connectionId: string) {
  const connection = await prisma.calendarConnection.findUnique({
    where: { id: connectionId },
    include: {
      webhookChannels: {
        where: { status: "ACTIVE" },
      },
    },
  });

  if (!connection) {
    throw new Error("Koneksi Google Calendar tidak ditemukan.");
  }

  // 1. Revoke tokens remotely at Google
  if (connection.encryptedRefreshToken || connection.encryptedAccessToken) {
    try {
      const tokenToRevoke = connection.encryptedRefreshToken
        ? decrypt(connection.encryptedRefreshToken)
        : decrypt(connection.encryptedAccessToken!);

      const oauth2Client = createOAuth2Client();
      await oauth2Client.revokeToken(tokenToRevoke);
    } catch (err) {
      console.warn("[GoogleDisconnect] Failed to revoke token remotely at Google:", err);
    }
  }

  // 2. Stop all active webhook channels
  for (const channel of connection.webhookChannels) {
    try {
      await stopCalendarWatchChannel(channel.channelId);
    } catch (err) {
      console.warn(`[GoogleDisconnect] Failed to stop watch channel ${channel.channelId}:`, err);
    }
  }

  // 3. Atomically update DB state and wipe sensitive tokens
  return prisma.$transaction(async (tx) => {
    // Clear external busy intervals cache
    await tx.calendarExternalBusyInterval.deleteMany({
      where: { calendarConnectionId: connectionId },
    });

    // Ensure all webhook channels are marked as STOPPED
    await tx.calendarWebhookChannel.updateMany({
      where: { calendarConnectionId: connectionId, status: "ACTIVE" },
      data: { status: "STOPPED" },
    });

    // Reset sync state
    await tx.calendarSyncState.updateMany({
      where: { calendarConnectionId: connectionId },
      data: {
        nextSyncToken: null,
        syncStatus: "IDLE",
        lastError: null,
      },
    });

    // Wipe credentials and update status to DISCONNECTED
    const updated = await tx.calendarConnection.update({
      where: { id: connectionId },
      data: {
        status: "DISCONNECTED",
        encryptedAccessToken: null,
        encryptedRefreshToken: null,
        tokenExpiresAt: null,
        lastErrorAt: null,
        lastErrorMessage: null,
      },
    });

    return updated;
  });
}
