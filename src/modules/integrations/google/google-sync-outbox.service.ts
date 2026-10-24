import { Prisma, PrismaClient } from "@prisma/client";
import { env } from "@/config/env";

export type CalendarOperationType =
  | "CREATE"
  | "RESCHEDULE"
  | "CANCEL"
  | "RESOURCE_BLOCK_CREATE"
  | "RESOURCE_BLOCK_CANCEL"
  | "FULL_SYNC";

export interface EnqueueJobParams {
  businessId: string;
  operationType: CalendarOperationType;
  bookingId?: string | null;
  resourceBlockId?: string | null;
  payload?: Record<string, unknown> | null;
}

/**
 * Enqueues an outbox sync job within a Prisma transaction.
 * If Google sync is disabled or business has no ACTIVE calendar connection,
 * this function gracefully does nothing without failing the host transaction.
 */
export async function enqueueCalendarSyncJob(
  tx: Prisma.TransactionClient | PrismaClient,
  params: EnqueueJobParams
) {
  const { businessId, operationType, bookingId, resourceBlockId, payload } = params;

  // 1. Guard: Check if sync feature flag is enabled
  if (!env.GOOGLE_CALENDAR_SYNC_ENABLED) {
    return null;
  }

  // 2. Fetch active calendar connection
  const connection = await tx.calendarConnection.findFirst({
    where: {
      businessId,
      provider: "GOOGLE",
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  if (!connection) {
    // No active Google Calendar connected; safely skip
    return null;
  }

  // 3. Create or update pending job in outbox queue
  const job = await tx.calendarSyncJob.create({
    data: {
      calendarConnectionId: connection.id,
      operationType,
      bookingId: bookingId ?? null,
      resourceBlockId: resourceBlockId ?? null,
      payload: (payload as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      status: "PENDING",
      attemptCount: 0,
      maxAttempts: env.GOOGLE_CALENDAR_RETRY_MAX_ATTEMPTS || 5,
      nextAttemptAt: new Date(),
    },
  });

  return job;
}
