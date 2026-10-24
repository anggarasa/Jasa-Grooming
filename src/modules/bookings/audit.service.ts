import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface LogAuditParams {
  bookingId?: string | null;
  actorUserId?: string | null;
  action: string;
  beforeData?: unknown;
  afterData?: unknown;
  reason?: string | null;
}

/**
 * Records administrative booking actions into BookingAuditLog.
 * Supports both standalone client and interactive transaction client.
 */
export async function logBookingAudit(
  txOrClient: Prisma.TransactionClient | PrismaClient | typeof prisma,
  params: LogAuditParams
) {
  return (txOrClient as Prisma.TransactionClient).bookingAuditLog.create({
    data: {
      bookingId: params.bookingId ?? null,
      actorUserId: params.actorUserId ?? null,
      action: params.action,
      beforeData: params.beforeData ? (params.beforeData as Prisma.InputJsonValue) : Prisma.DbNull,
      afterData: params.afterData ? (params.afterData as Prisma.InputJsonValue) : Prisma.DbNull,
      reason: params.reason ?? null,
    },
  });
}
