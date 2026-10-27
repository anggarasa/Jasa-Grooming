import { prisma } from "@backend/lib/prisma";
import { getCalendarClient } from "./calendar-client.factory";
import {
  syncBookingToGoogle,
  deleteBookingFromGoogle,
  syncResourceBlockToGoogle,
  deleteResourceBlockFromGoogle,
} from "./google-events.service";
import { performIncrementalSync } from "./google-incremental-sync.service";
import crypto from "crypto";

const WORKER_ID = `worker-${process.pid}-${crypto.randomBytes(4).toString("hex")}`;

/**
 * Recovers stale or deadlocked jobs whose processing lock has expired
 */
export async function recoverDeadlockedJobs(): Promise<number> {
  const now = new Date();
  const recovered = await prisma.calendarSyncJob.updateMany({
    where: {
      status: "PROCESSING",
      lockedUntil: { lt: now },
    },
    data: {
      status: "PENDING",
      lockedUntil: null,
      lockedBy: null,
    },
  });

  return recovered.count;
}

/**
 * Claims a batch of pending or ready-to-retry jobs atomically
 */
export async function claimSyncJobs(limit = 10) {
  const now = new Date();
  const lockExpiration = new Date(Date.now() + 60 * 1000); // 1 minute lock

  // 1. Find candidate IDs
  const candidates = await prisma.calendarSyncJob.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      attemptCount: { lt: prisma.calendarSyncJob.fields.maxAttempts },
      nextAttemptAt: { lte: now },
      OR: [
        { lockedUntil: null },
        { lockedUntil: { lt: now } },
      ],
    },
    take: limit,
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (candidates.length === 0) {
    return [];
  }

  const ids = candidates.map((c) => c.id);

  // 2. Atomically lock the selected jobs
  await prisma.calendarSyncJob.updateMany({
    where: { id: { in: ids } },
    data: {
      status: "PROCESSING",
      lockedUntil: lockExpiration,
      lockedBy: WORKER_ID,
    },
  });

  // 3. Return claimed jobs
  return prisma.calendarSyncJob.findMany({
    where: { id: { in: ids } },
    include: {
      calendarConnection: true,
      booking: {
        include: {
          customer: true,
          pet: true,
          service: true,
        },
      },
      resourceBlock: true,
    },
  });
}

/**
 * Calculates exponential backoff in seconds for retries
 */
export function calculateBackoffSeconds(attempt: number): number {
  return Math.min(3600, Math.max(10, Math.pow(2, attempt) * 10));
}

/**
 * Executes a single outbox sync job with resilient error handling and exponential backoff
 */
export async function executeSyncJob(jobId: string) {
  const job = await prisma.calendarSyncJob.findUnique({
    where: { id: jobId },
    include: {
      calendarConnection: true,
      booking: {
        include: {
          customer: true,
          pet: true,
          service: true,
        },
      },
      resourceBlock: true,
    },
  });

  if (!job) return;

  const { calendarConnection } = job;
  if (!calendarConnection || calendarConnection.status !== "ACTIVE") {
    // If connection was disconnected, mark job as completed/skipped
    await prisma.calendarSyncJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        lastError: "Koneksi Google Calendar tidak aktif. Job dilewati.",
        lockedUntil: null,
        lockedBy: null,
      },
    });
    return;
  }

  // Guard against orphan jobs
  if (
    (job.operationType === "RESOURCE_BLOCK_CREATE" && !job.resourceBlock) ||
    (job.operationType === "RESOURCE_BLOCK_CANCEL" && !job.resourceBlockId) ||
    ((job.operationType === "CREATE" || job.operationType === "RESCHEDULE") && !job.booking) ||
    (job.operationType === "CANCEL" && !job.bookingId)
  ) {
    await prisma.calendarSyncJob.update({
      where: { id: job.id },
      data: {
        status: "DEAD_LETTER",
        lastError: "Data referensi job (booking / resource block) tidak ditemukan atau bernilai null.",
        lockedUntil: null,
        lockedBy: null,
      },
    });
    return;
  }

  try {
    const { calendar, selectedCalendarId } = await getCalendarClient(calendarConnection.id);

    switch (job.operationType) {
      case "CREATE":
      case "RESCHEDULE": {
        if (!job.booking) {
          throw new Error(`Data reservasi dengan ID ${job.bookingId} tidak ditemukan.`);
        }
        await syncBookingToGoogle({
          calendar,
          calendarId: selectedCalendarId,
          calendarConnectionId: calendarConnection.id,
          booking: job.booking,
        });
        break;
      }

      case "CANCEL": {
        if (!job.bookingId) {
          throw new Error("Job CANCEL membutuhkan bookingId.");
        }
        await deleteBookingFromGoogle({
          calendar,
          calendarId: selectedCalendarId,
          bookingId: job.bookingId,
        });
        break;
      }

      case "RESOURCE_BLOCK_CREATE": {
        if (!job.resourceBlock) {
          throw new Error(`Data blokir dengan ID ${job.resourceBlockId} tidak ditemukan.`);
        }
        await syncResourceBlockToGoogle({
          calendar,
          calendarId: selectedCalendarId,
          calendarConnectionId: calendarConnection.id,
          block: job.resourceBlock,
        });
        break;
      }

      case "RESOURCE_BLOCK_CANCEL": {
        if (!job.resourceBlockId) {
          throw new Error("Job RESOURCE_BLOCK_CANCEL membutuhkan resourceBlockId.");
        }
        await deleteResourceBlockFromGoogle({
          calendar,
          calendarId: selectedCalendarId,
          resourceBlockId: job.resourceBlockId,
        });
        break;
      }

      case "FULL_SYNC": {
        await performIncrementalSync({
          connectionId: calendarConnection.id,
          forceFullSync: true,
        });
        break;
      }

      default:
        console.warn(`[GoogleSyncWorker] Unknown operationType: ${job.operationType}`);
    }

    // Success
    await prisma.calendarSyncJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        lastError: null,
        lockedUntil: null,
        lockedBy: null,
      },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const nextAttempt = job.attemptCount + 1;
    const isExhausted = nextAttempt >= job.maxAttempts;
    const backoffSeconds = calculateBackoffSeconds(nextAttempt);
    const nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000);

    await prisma.calendarSyncJob.update({
      where: { id: job.id },
      data: {
        status: isExhausted ? "DEAD_LETTER" : "FAILED",
        attemptCount: nextAttempt,
        nextAttemptAt,
        lastError: errMsg,
        lockedUntil: null,
        lockedBy: null,
      },
    });

    // Update connection error record
    await prisma.calendarConnection.update({
      where: { id: calendarConnection.id },
      data: {
        lastErrorAt: new Date(),
        lastErrorMessage: `Gagal sinkronisasi job (${job.operationType}): ${errMsg}`,
      },
    });
  }
}

/**
 * Runs a single worker processing iteration
 */
export async function runSyncWorkerCycle(batchLimit = 10) {
  await recoverDeadlockedJobs();
  const jobs = await claimSyncJobs(batchLimit);

  for (const job of jobs) {
    await executeSyncJob(job.id);
  }

  return jobs.length;
}
