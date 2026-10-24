import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  listCalendarConflicts,
  getCalendarConflictDetail,
  resolveCalendarConflict,
} from "@/modules/integrations/google/google-conflict.service";
import { disconnectGoogleAccount } from "@/modules/integrations/google/google-disconnect.service";
import { encrypt } from "@/lib/encryption";
import { Role } from "@prisma/client";

describe("Google Calendar Conflicts & Disconnect Workflows", () => {
  let testBusinessId: string;
  let testUserId: string;
  let testConnectionId: string;

  beforeEach(async () => {
    // Use isolated test business fixture
    const business = await prisma.business.upsert({
      where: { slug: "test-fixture-biz-conflicts" },
      create: {
        id: "test-fixture-biz-conflicts-id",
        name: "Test Conflicts Fixture",
        slug: "test-fixture-biz-conflicts",
      },
      update: {},
    });
    testBusinessId = business.id;

    // Get or create owner user
    let user = await prisma.user.findFirst({ where: { role: Role.OWNER } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "Test Owner",
          email: "owner.conflict.test@pawcare.test",
          passwordHash: "dummy",
          role: Role.OWNER,
        },
      });
    }
    testUserId = user.id;

    // Upsert connection
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
        calendarId: "primary",
        encryptedAccessToken: encrypt("test-access-token"),
        encryptedRefreshToken: encrypt("test-refresh-token"),
        tokenExpiresAt: new Date(Date.now() + 3600000),
        status: "ACTIVE",
      },
      update: {
        encryptedAccessToken: encrypt("test-access-token"),
        encryptedRefreshToken: encrypt("test-refresh-token"),
        tokenExpiresAt: new Date(Date.now() + 3600000),
        status: "ACTIVE",
      },
    });
    testConnectionId = conn.id;

    // Clean up previous conflicts and intervals
    await prisma.calendarSyncConflict.deleteMany({
      where: { calendarConnectionId: testConnectionId },
    });
    await prisma.calendarExternalBusyInterval.deleteMany({
      where: { calendarConnectionId: testConnectionId },
    });
  });

  it("mencatat konflik kalender dan menyelesaikannya dengan KEEP_LOCAL", async () => {
    // Buat dummy conflict
    const conflict = await prisma.calendarSyncConflict.create({
      data: {
        calendarConnectionId: testConnectionId,
        conflictType: "OVERLAPPING_EXTERNAL_EVENT",
        localSnapshot: { bookingCode: "PC-TEST-001" },
        remoteSnapshot: { summary: "Rapat Google Eksternal" },
        status: "PENDING",
      },
    });

    const list = await listCalendarConflicts({ connectionId: testConnectionId });
    expect(list.items.length).toBeGreaterThanOrEqual(1);

    const detail = await getCalendarConflictDetail(conflict.id);
    expect(detail.id).toBe(conflict.id);

    // Resolve dengan KEEP_LOCAL
    const resolved = await resolveCalendarConflict({
      conflictId: conflict.id,
      resolution: "KEEP_LOCAL",
      userId: testUserId,
      notes: "Prioritaskan reservasi toko PawCare",
    });

    expect(resolved.status).toBe("RESOLVED_KEEP_LOCAL");
    expect(resolved.resolvedByUserId).toBe(testUserId);
    expect(resolved.resolvedAt).toBeDefined();
  });

  it("menjalankan alur disconnect secara aman: token dihapus dan cache dibersihkan", async () => {
    // Tambahkan dummy busy interval
    await prisma.calendarExternalBusyInterval.create({
      data: {
        calendarConnectionId: testConnectionId,
        externalEventId: "ext_test_event_1",
        startAt: new Date(),
        endAt: new Date(Date.now() + 3600000),
      },
    });

    // Jalankan disconnect
    const updated = await disconnectGoogleAccount(testConnectionId);

    expect(updated.status).toBe("DISCONNECTED");
    expect(updated.encryptedAccessToken).toBeNull();
    expect(updated.encryptedRefreshToken).toBeNull();
    expect(updated.tokenExpiresAt).toBeNull();

    // Pastikan interval cache dibersihkan
    const remainingIntervals = await prisma.calendarExternalBusyInterval.count({
      where: { calendarConnectionId: testConnectionId },
    });
    expect(remainingIntervals).toBe(0);
  });

  afterAll(async () => {
    try {
      await prisma.calendarExternalBusyInterval.deleteMany({
        where: { calendarConnection: { businessId: "test-fixture-biz-conflicts-id" } },
      });
      await prisma.calendarSyncConflict.deleteMany({
        where: { calendarConnection: { businessId: "test-fixture-biz-conflicts-id" } },
      });
      await prisma.calendarConnection.deleteMany({
        where: { businessId: "test-fixture-biz-conflicts-id" },
      });
      await prisma.business.deleteMany({
        where: { id: "test-fixture-biz-conflicts-id" },
      });
    } catch {}
  });
});
