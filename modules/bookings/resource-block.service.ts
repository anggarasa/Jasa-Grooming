import prisma from "@backend/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { acquireResourceAdvisoryLock } from "./concurrency-lock";
import { logBookingAudit } from "./audit.service";
import { enqueueCalendarSyncJob } from "@backend/modules/integrations/google/google-sync-outbox.service";

export class ResourceBlockConflictError extends Error {
  constructor(
    message = "Waktu pemblokiran bertabrakan dengan jadwal reservasi atau blokir waktu yang sudah ada.",
    public statusCode = 409,
    public code = "BLOCK_CONFLICT"
  ) {
    super(message);
    this.name = "ResourceBlockConflictError";
  }
}

export interface CreateResourceBlockParams {
  businessId: string;
  resourceId: string;
  startAt: string | Date;
  endAt: string | Date;
  reason: string;
  actorUserId?: string | null;
}

export async function createResourceBlock(params: CreateResourceBlockParams) {
  const startAt = new Date(params.startAt);
  const endAt = new Date(params.endAt);

  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
    throw new Error("Format tanggal startAt atau endAt tidak valid.");
  }
  if (startAt >= endAt) {
    throw new Error("Waktu mulai harus lebih awal dari waktu selesai.");
  }

  // Verify resource exists and belongs to business
  const resource = await prisma.bookingResource.findFirst({
    where: {
      id: params.resourceId,
      businessId: params.businessId,
      isActive: true,
    },
  });

  if (!resource) {
    throw new Error("Stasiun grooming tidak ditemukan atau tidak aktif.");
  }

  return prisma.$transaction(async (tx) => {
    // Acquire PostgreSQL advisory lock on the resource
    await acquireResourceAdvisoryLock(tx, resource.id);

    // 1. Check for overlapping active bookings
    const overlappingBooking = await tx.booking.findFirst({
      where: {
        resourceId: resource.id,
        status: {
          in: [
            BookingStatus.CONFIRMED,
            BookingStatus.PENDING,
            BookingStatus.CHECKED_IN,
            BookingStatus.IN_PROGRESS,
          ],
        },
        startAt: { lt: endAt },
        occupancyEndAt: { gt: startAt },
      },
      select: {
        id: true,
        bookingCode: true,
        startAt: true,
        occupancyEndAt: true,
      },
    });

    if (overlappingBooking) {
      throw new ResourceBlockConflictError(
        `Waktu pemblokiran bertabrakan dengan reservasi aktif (${overlappingBooking.bookingCode}).`
      );
    }

    // 2. Check for overlapping active resource blocks
    const overlappingBlock = await tx.resourceBlock.findFirst({
      where: {
        resourceId: resource.id,
        cancelledAt: null,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: {
        id: true,
        reason: true,
        startAt: true,
        endAt: true,
      },
    });

    if (overlappingBlock) {
      throw new ResourceBlockConflictError(
        `Waktu pemblokiran bertabrakan dengan blokir waktu yang sudah ada ("${overlappingBlock.reason}").`
      );
    }

    // 3. Create ResourceBlock
    const createdBlock = await tx.resourceBlock.create({
      data: {
        businessId: params.businessId,
        resourceId: resource.id,
        startAt,
        endAt,
        reason: params.reason,
        createdByUserId: params.actorUserId ?? null,
      },
      include: {
        resource: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 4. Log Audit
    await logBookingAudit(tx, {
      actorUserId: params.actorUserId,
      action: "CREATE_RESOURCE_BLOCK",
      afterData: {
        id: createdBlock.id,
        resourceId: createdBlock.resourceId,
        startAt: createdBlock.startAt.toISOString(),
        endAt: createdBlock.endAt.toISOString(),
        reason: createdBlock.reason,
      },
      reason: params.reason,
    });

    // Enqueue Google Calendar Outbox Sync Job
    await enqueueCalendarSyncJob(tx, {
      businessId: params.businessId,
      operationType: "RESOURCE_BLOCK_CREATE",
      resourceBlockId: createdBlock.id,
    });

    return createdBlock;
  });
}

export async function listResourceBlocks(params: {
  businessId: string;
  resourceId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  includeCancelled?: boolean;
}) {
  const where: import("@prisma/client").Prisma.ResourceBlockWhereInput = {
    businessId: params.businessId,
  };

  if (params.resourceId) {
    where.resourceId = params.resourceId;
  }

  if (!params.includeCancelled) {
    where.cancelledAt = null;
  }

  if (params.startDate || params.endDate) {
    const startFilter = params.startDate ? new Date(params.startDate) : undefined;
    const endFilter = params.endDate ? new Date(params.endDate) : undefined;

    where.AND = [
      ...(startFilter ? [{ endAt: { gt: startFilter } }] : []),
      ...(endFilter ? [{ startAt: { lt: endFilter } }] : []),
    ];
  }

  return prisma.resourceBlock.findMany({
    where,
    orderBy: { startAt: "asc" },
    include: {
      resource: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function cancelResourceBlock(params: {
  id: string;
  businessId: string;
  actorUserId?: string | null;
  reason?: string;
}) {
  const block = await prisma.resourceBlock.findFirst({
    where: {
      id: params.id,
      businessId: params.businessId,
    },
  });

  if (!block) {
    throw new Error("Blokir waktu tidak ditemukan.");
  }

  if (block.cancelledAt) {
    throw new Error("Blokir waktu sudah dibatalkan sebelumnya.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.resourceBlock.update({
      where: { id: block.id },
      data: {
        cancelledAt: new Date(),
      },
    });

    await logBookingAudit(tx, {
      actorUserId: params.actorUserId,
      action: "CANCEL_RESOURCE_BLOCK",
      beforeData: { id: block.id, cancelledAt: null },
      afterData: { id: updated.id, cancelledAt: updated.cancelledAt?.toISOString() },
      reason: params.reason || "Dibatalkan oleh staf admin",
    });

    // Enqueue Google Calendar Outbox Sync Job
    await enqueueCalendarSyncJob(tx, {
      businessId: params.businessId,
      operationType: "RESOURCE_BLOCK_CANCEL",
      resourceBlockId: updated.id,
    });

    return updated;
  });
}
