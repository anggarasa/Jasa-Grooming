import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { enqueueCalendarSyncJob } from "@/modules/integrations/google/google-sync-outbox.service";
import {
  claimSyncJobs,
  recoverDeadlockedJobs,
  calculateBackoffSeconds,
} from "@/modules/integrations/google/google-sync-worker.service";
import { env } from "@/config/env";

describe("Google Calendar Outbox Queue & Worker", () => {
  let testBusinessId: string;
  let testConnectionId: string;

  beforeEach(async () => {
    // Enable flag for test
    (env as { GOOGLE_CALENDAR_SYNC_ENABLED: boolean }).GOOGLE_CALENDAR_SYNC_ENABLED = true;

    // Use isolated test business fixture
    const business = await prisma.business.upsert({
      where: { slug: "test-fixture-biz-outbox" },
      create: {
        id: "test-fixture-biz-outbox-id",
        name: "Test Outbox Fixture",
        slug: "test-fixture-biz-outbox",
      },
      update: {},
    });
    testBusinessId = business.id;

    // Upsert a test calendar connection
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
        status: "ACTIVE",
      },
      update: {
        status: "ACTIVE",
      },
    });
    testConnectionId = conn.id;

    // Clean up test jobs
    await prisma.calendarSyncJob.deleteMany({
      where: { calendarConnectionId: testConnectionId },
    });
  });

  afterAll(async () => {
    try {
      await prisma.calendarSyncJob.deleteMany({
        where: { calendarConnection: { businessId: "test-fixture-biz-outbox-id" } },
      });
      await prisma.calendarConnection.deleteMany({
        where: { businessId: "test-fixture-biz-outbox-id" },
      });
      await prisma.business.deleteMany({
        where: { id: "test-fixture-biz-outbox-id" },
      });
    } catch {}
  });

  it("berhasil melakukan transactional enqueue ke tabel calendar_sync_jobs", async () => {
    const job = await enqueueCalendarSyncJob(prisma, {
      businessId: testBusinessId,
      operationType: "FULL_SYNC",
    });

    expect(job).toBeDefined();
    expect(job?.operationType).toBe("FULL_SYNC");
    expect(job?.status).toBe("PENDING");
    expect(job?.attemptCount).toBe(0);

    const count = await prisma.calendarSyncJob.count({
      where: { calendarConnectionId: testConnectionId },
    });
    expect(count).toBe(1);
  });

  it("mengklaim job pending dan mengunci lockedUntil secara atomik", async () => {
    await enqueueCalendarSyncJob(prisma, {
      businessId: testBusinessId,
      operationType: "FULL_SYNC",
    });

    const claimed = await claimSyncJobs(10);
    expect(claimed.length).toBeGreaterThanOrEqual(1);

    const first = claimed[0];
    expect(first.status).toBe("PROCESSING");
    expect(first.lockedUntil).toBeDefined();
    expect(first.lockedBy).toBeDefined();
  });

  it("memulihkan job yang mengalami deadlock ketika batas lockedUntil telah lewat", async () => {
    // Buat job yang terkunci di masa lalu
    await prisma.calendarSyncJob.create({
      data: {
        calendarConnectionId: testConnectionId,
        operationType: "FULL_SYNC",
        status: "PROCESSING",
        lockedUntil: new Date(Date.now() - 10000), // 10 detik yang lalu
        lockedBy: "worker-stale",
      },
    });

    const recovered = await recoverDeadlockedJobs();
    expect(recovered).toBeGreaterThanOrEqual(1);

    const staleJob = await prisma.calendarSyncJob.findFirst({
      where: {
        calendarConnectionId: testConnectionId,
        lockedBy: null,
      },
    });
    expect(staleJob?.status).toBe("PENDING");
  });

  it("menghitung eksponensial backoff detik dengan benar", () => {
    expect(calculateBackoffSeconds(1)).toBe(20);
    expect(calculateBackoffSeconds(2)).toBe(40);
    expect(calculateBackoffSeconds(3)).toBe(80);
    expect(calculateBackoffSeconds(5)).toBe(320);
    expect(calculateBackoffSeconds(10)).toBe(3600); // capped at 3600
  });
});
