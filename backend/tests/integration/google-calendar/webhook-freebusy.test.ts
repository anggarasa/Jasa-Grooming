import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@backend/lib/prisma";
import { processGoogleWebhook } from "@backend/modules/integrations/google/google-webhook.service";
import { queryGoogleFreeBusy } from "@backend/modules/integrations/google/google-freebusy.service";
import { hashWebhookToken } from "@backend/lib/encryption";
import { env } from "@backend/config/env";

describe("Google Calendar Webhook & FreeBusy Fail-Closed Engine", () => {
  let testBusinessId: string;
  let testConnectionId: string;
  const channelId = "test-webhook-channel-001";
  const rawToken = "my-secret-webhook-token-12345";

  beforeEach(async () => {
    // Use isolated test business fixture
    const business = await prisma.business.upsert({
      where: { slug: "test-fixture-biz-webhook" },
      create: {
        id: "test-fixture-biz-webhook-id",
        name: "Test Webhook Fixture",
        slug: "test-fixture-biz-webhook",
      },
      update: {},
    });
    testBusinessId = business.id;

    const conn = await prisma.calendarConnection.upsert({
      where: {
        businessId_provider: {
          businessId: testBusinessId,
          provider: "GOOGLE",
        },
      },
      create: {
        businessId: testBusinessId,
        provider: "GOOGLE",
        status: "ACTIVE",
      },
      update: {
        status: "ACTIVE",
      },
    });
    testConnectionId = conn.id;

    // Create webhook channel record
    await prisma.calendarWebhookChannel.deleteMany({
      where: { channelId },
    });
    await prisma.calendarWebhookChannel.create({
      data: {
        calendarConnectionId: testConnectionId,
        channelId,
        resourceId: "resource-google-999",
        verificationTokenHash: hashWebhookToken(rawToken),
        expirationAt: new Date(Date.now() + 86400000),
        status: "ACTIVE",
      },
    });
  });

  afterAll(async () => {
    try {
      await prisma.calendarWebhookChannel.deleteMany({
        where: { calendarConnection: { businessId: "test-fixture-biz-webhook-id" } },
      });
      await prisma.calendarConnection.deleteMany({
        where: { businessId: "test-fixture-biz-webhook-id" },
      });
      await prisma.business.deleteMany({
        where: { id: "test-fixture-biz-webhook-id" },
      });
    } catch {}
  });

  describe("Webhook Notifications", () => {
    it("merespons konfirmasi handshake saat Google mengirim resourceState 'sync'", async () => {
      const result = await processGoogleWebhook({
        channelId,
        resourceId: "resource-google-999",
        resourceState: "sync",
        channelToken: rawToken,
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe("HANDSHAKE_CONFIRMED");
    });

    it("menolak webhook request jika token verifikasi salah (HTTP 403)", async () => {
      await expect(
        processGoogleWebhook({
          channelId,
          resourceId: "resource-google-999",
          resourceState: "exists",
          channelToken: "wrong-fake-token",
        })
      ).rejects.toThrow("Token verifikasi webhook tidak valid.");
    });

    it("menolak webhook request jika channelId tidak terdaftar (HTTP 404)", async () => {
      await expect(
        processGoogleWebhook({
          channelId: "unregistered-channel-id",
          resourceId: "resource-999",
          resourceState: "sync",
        })
      ).rejects.toThrow("Channel ID tidak terdaftar.");
    });
  });

  describe("FreeBusy Fail-Closed Policy", () => {
    it("menerapkan kebijakan fail-closed saat Google sync aktif tetapi kredensial/koneksi gagal diakses", async () => {
      (env as { GOOGLE_CALENDAR_SYNC_ENABLED: boolean }).GOOGLE_CALENDAR_SYNC_ENABLED = true;

      const timeMin = new Date("2026-10-24T00:00:00.000Z");
      const timeMax = new Date("2026-10-24T12:00:00.000Z");

      const result = await queryGoogleFreeBusy({
        businessId: testBusinessId,
        timeMin,
        timeMax,
      });

      expect(result.isAvailableChecked).toBe(true);
      expect(result.isFailClosed).toBe(true);
      // Seluruh interval timeMin ke timeMax ditutup (marked busy)
      expect(result.busyIntervals).toHaveLength(1);
      expect(result.busyIntervals[0].start.toISOString()).toBe(timeMin.toISOString());
      expect(result.busyIntervals[0].end.toISOString()).toBe(timeMax.toISOString());
    });

    it("bypasses FreeBusy check secara bersih ketika flag GOOGLE_CALENDAR_SYNC_ENABLED bernilai false", async () => {
      (env as { GOOGLE_CALENDAR_SYNC_ENABLED: boolean }).GOOGLE_CALENDAR_SYNC_ENABLED = false;

      const timeMin = new Date("2026-10-24T00:00:00.000Z");
      const timeMax = new Date("2026-10-24T12:00:00.000Z");

      const result = await queryGoogleFreeBusy({
        businessId: testBusinessId,
        timeMin,
        timeMax,
      });

      expect(result.isAvailableChecked).toBe(false);
      expect(result.isFailClosed).toBe(false);
      expect(result.busyIntervals).toEqual([]);
    });
  });
});
