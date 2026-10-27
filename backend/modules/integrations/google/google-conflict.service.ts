import { prisma } from "@backend/lib/prisma";
import { enqueueCalendarSyncJob } from "./google-sync-outbox.service";
import { BookingStatus } from "@prisma/client";

export class ConflictResolutionError extends Error {
  constructor(
    message: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = "ConflictResolutionError";
  }
}

/**
 * Lists detected synchronization conflicts
 */
export async function listCalendarConflicts(params: {
  businessId?: string;
  connectionId?: string;
  status?: string;
  limit?: number;
  page?: number;
}) {
  const { businessId, connectionId, status = "PENDING", limit = 20, page = 1 } = params;

  const where: import("@prisma/client").Prisma.CalendarSyncConflictWhereInput = {
    ...(status ? { status } : {}),
  };

  if (connectionId) {
    where.calendarConnectionId = connectionId;
  } else if (businessId) {
    where.calendarConnection = {
      businessId,
    };
  }

  const [total, items] = await Promise.all([
    prisma.calendarSyncConflict.count({ where }),
    prisma.calendarSyncConflict.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { detectedAt: "desc" },
      include: {
        booking: {
          include: {
            customer: true,
            pet: true,
            service: true,
          },
        },
        resourceBlock: true,
        resolvedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
  ]);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Gets detail of a single sync conflict
 */
export async function getCalendarConflictDetail(conflictId: string) {
  const conflict = await prisma.calendarSyncConflict.findUnique({
    where: { id: conflictId },
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
      resolvedByUser: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!conflict) {
    throw new ConflictResolutionError("Konflik kalender tidak ditemukan.", 404);
  }

  return conflict;
}

/**
 * Resolves a synchronization conflict manually
 */
export async function resolveCalendarConflict(params: {
  conflictId: string;
  resolution: "KEEP_LOCAL" | "OVERWRITE_LOCAL" | "IGNORE";
  userId: string;
  notes?: string;
}) {
  const { conflictId, resolution, userId, notes } = params;

  const conflict = await prisma.calendarSyncConflict.findUnique({
    where: { id: conflictId },
    include: {
      calendarConnection: true,
      booking: true,
      resourceBlock: true,
    },
  });

  if (!conflict) {
    throw new ConflictResolutionError("Konflik kalender tidak ditemukan.", 404);
  }

  if (conflict.status !== "PENDING") {
    throw new ConflictResolutionError("Konflik ini sudah diselesaikan sebelumnya.", 400);
  }

  return prisma.$transaction(async (tx) => {
    let resolvedStatus = "IGNORED";

    if (resolution === "KEEP_LOCAL") {
      resolvedStatus = "RESOLVED_KEEP_LOCAL";

      // If associated with a booking, re-enqueue sync to force remote overwrite
      if (conflict.bookingId) {
        await enqueueCalendarSyncJob(tx, {
          businessId: conflict.calendarConnection.businessId,
          operationType: "RESCHEDULE",
          bookingId: conflict.bookingId,
        });
      } else if (conflict.resourceBlockId) {
        await enqueueCalendarSyncJob(tx, {
          businessId: conflict.calendarConnection.businessId,
          operationType: "RESOURCE_BLOCK_CREATE",
          resourceBlockId: conflict.resourceBlockId,
        });
      }
    } else if (resolution === "OVERWRITE_LOCAL") {
      resolvedStatus = "RESOLVED_OVERWRITE_LOCAL";

      // Handle remote deletion by cancelling local booking
      if (conflict.conflictType === "REMOTE_DELETED" && conflict.bookingId) {
        await tx.booking.update({
          where: { id: conflict.bookingId },
          data: {
            status: BookingStatus.CANCELLED,
            cancelledAt: new Date(),
            cancellationReason: `Dibatalkan otomatis sesuai resolusi kalender Google (${notes || "Remote Deleted"})`,
            lastModifiedByUserId: userId,
          },
        });
      }
    }

    const updated = await tx.calendarSyncConflict.update({
      where: { id: conflictId },
      data: {
        status: resolvedStatus,
        resolvedAt: new Date(),
        resolvedByUserId: userId,
        resolutionNotes: notes ?? null,
      },
    });

    return updated;
  });
}
