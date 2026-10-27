import { Prisma } from "@prisma/client";

/**
 * Computes deterministic 32-bit integer for PostgreSQL advisory transaction lock.
 */
export function computeResourceLockId(resourceId: string): number {
  const input = `pawcare_booking_resource_${resourceId}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Convert to 32-bit signed integer
  }
  return hash;
}

/**
 * Acquires transaction-scoped PostgreSQL advisory lock on a booking station.
 * The lock is held automatically until the transaction completes (commit or rollback).
 */
export async function acquireResourceAdvisoryLock(
  tx: Prisma.TransactionClient,
  resourceId: string
): Promise<void> {
  const lockId = computeResourceLockId(resourceId);
  await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${lockId})`);
}
