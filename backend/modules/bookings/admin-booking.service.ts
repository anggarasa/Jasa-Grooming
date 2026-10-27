import prisma from "@backend/lib/prisma";
import { BookingStatus, Prisma } from "@prisma/client";
import {
  getDayOfWeekJakarta,
  jakartaDateToUtc,
  timeToMinutes,
  isIntervalOverlapping,
} from "@backend/modules/availability/slot-generator";
import { acquireResourceAdvisoryLock } from "./concurrency-lock";
import { generateBookingCode } from "./code-generator";
import { generateGuestToken } from "./token.service";
import { logBookingAudit } from "./audit.service";
import { assertValidTransition } from "./state-machine";
import { SlotUnavailableError, BookingValidationError } from "./booking.service";
import {
  AdminListBookingsQuery,
  AdminWalkInInput,
  UpdateBookingStatusInput,
} from "./admin-schemas";
import { enqueueCalendarSyncJob } from "@backend/modules/integrations/google/google-sync-outbox.service";

/**
 * Returns YYYY-MM-DD string for current time in Asia/Jakarta timezone.
 */
export function getJakartaTodayString(now = new Date()): string {
  const jakartaNoon = new Date(now.getTime() + 7 * 3600 * 1000);
  return jakartaNoon.toISOString().slice(0, 10);
}

/**
 * Fetches dashboard KPI metrics and today's schedule for Asia/Jakarta timezone.
 */
export async function getDashboardOverview(businessId: string) {
  const now = new Date();
  const todayStr = getJakartaTodayString(now);

  const startOfDay = jakartaDateToUtc(todayStr, "00:00");
  const endOfDay = new Date(startOfDay.getTime() + 24 * 3600 * 1000 - 1);

  const [
    todayTotal,
    confirmedToday,
    checkedInToday,
    inProgressToday,
    completedToday,
    cancelledToday,
    upcomingTotal,
    todayBookings,
  ] = await Promise.all([
    // Total bookings for today
    prisma.booking.count({
      where: {
        businessId,
        startAt: { gte: startOfDay, lte: endOfDay },
      },
    }),
    // Confirmed today
    prisma.booking.count({
      where: {
        businessId,
        status: BookingStatus.CONFIRMED,
        startAt: { gte: startOfDay, lte: endOfDay },
      },
    }),
    // Checked in today
    prisma.booking.count({
      where: {
        businessId,
        status: BookingStatus.CHECKED_IN,
        startAt: { gte: startOfDay, lte: endOfDay },
      },
    }),
    // In progress today
    prisma.booking.count({
      where: {
        businessId,
        status: BookingStatus.IN_PROGRESS,
        startAt: { gte: startOfDay, lte: endOfDay },
      },
    }),
    // Completed today
    prisma.booking.count({
      where: {
        businessId,
        status: BookingStatus.COMPLETED,
        startAt: { gte: startOfDay, lte: endOfDay },
      },
    }),
    // Cancelled today
    prisma.booking.count({
      where: {
        businessId,
        status: BookingStatus.CANCELLED,
        startAt: { gte: startOfDay, lte: endOfDay },
      },
    }),
    // Upcoming future active bookings
    prisma.booking.count({
      where: {
        businessId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        startAt: { gte: now },
      },
    }),
    // Today's appointments list
    prisma.booking.findMany({
      where: {
        businessId,
        startAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        customer: true,
        pet: true,
        service: true,
        resource: true,
      },
      orderBy: { startAt: "asc" },
    }),
  ]);

  return {
    today: todayStr,
    metrics: {
      todayTotal,
      confirmedToday,
      checkedInToday,
      inProgressToday,
      completedToday,
      cancelledToday,
      upcomingTotal,
    },
    todayBookings,
  };
}

/**
 * Lists bookings with pagination, multi-field search, and status/date filters.
 */
export async function listAdminBookings(
  businessId: string,
  query: AdminListBookingsQuery
) {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    date,
    startDate,
    endDate,
    serviceId,
    resourceId,
    sortBy = "startAt",
    sortOrder = "desc",
  } = query;

  const where: Prisma.BookingWhereInput = {
    businessId,
  };

  if (status) {
    where.status = status;
  }

  if (serviceId) {
    where.serviceId = serviceId;
  }

  if (resourceId) {
    where.resourceId = resourceId;
  }

  // Date filtering
  if (date) {
    const dayStart = jakartaDateToUtc(date, "00:00");
    const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000 - 1);
    where.startAt = { gte: dayStart, lte: dayEnd };
  } else if (startDate || endDate) {
    const startRange = startDate ? jakartaDateToUtc(startDate, "00:00") : undefined;
    const endRange = endDate
      ? new Date(jakartaDateToUtc(endDate, "00:00").getTime() + 24 * 3600 * 1000 - 1)
      : undefined;

    where.startAt = {
      ...(startRange ? { gte: startRange } : {}),
      ...(endRange ? { lte: endRange } : {}),
    };
  }

  // Multi-field search
  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { bookingCode: { contains: term, mode: "insensitive" } },
      { customer: { name: { contains: term, mode: "insensitive" } } },
      { customer: { phone: { contains: term } } },
      { pet: { name: { contains: term, mode: "insensitive" } } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: true,
        pet: true,
        service: true,
        resource: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

/**
 * Returns full booking detail with snapshots, histories, and audit logs.
 */
export async function getAdminBookingDetail(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      pet: true,
      service: true,
      resource: true,
      statusHistories: {
        orderBy: { createdAt: "desc" },
      },
      rescheduleHistories: {
        orderBy: { createdAt: "desc" },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!booking) {
    throw new BookingValidationError("Reservasi tidak ditemukan.", 404, "NOT_FOUND");
  }

  return booking;
}

/**
 * Updates booking status respecting the state machine and records audit logs.
 */
export async function updateBookingStatus(params: {
  bookingId: string;
  input: UpdateBookingStatusInput;
  actorUserId?: string | null;
}) {
  const { bookingId, input, actorUserId } = params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new BookingValidationError("Reservasi tidak ditemukan.", 404, "NOT_FOUND");
  }

  // Validate state machine transition
  assertValidTransition(booking.status, input.status);

  if (input.status === BookingStatus.CANCELLED && !input.reason) {
    throw new BookingValidationError("Alasan pembatalan wajib disertakan.", 400, "REASON_REQUIRED");
  }

  return prisma.$transaction(async (tx) => {
    // Acquire resource advisory lock to prevent race condition during status transition
    await acquireResourceAdvisoryLock(tx, booking.resourceId);

    // Re-verify current status inside transaction to prevent invalid state transitions
    const current = await tx.booking.findUnique({
      where: { id: booking.id },
      select: { status: true },
    });
    if (!current) {
      throw new BookingValidationError("Reservasi tidak ditemukan.", 404, "NOT_FOUND");
    }
    assertValidTransition(current.status, input.status);

    const isCancelling = input.status === BookingStatus.CANCELLED;

    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: input.status,
        ...(isCancelling
          ? {
              cancelledAt: new Date(),
              cancellationReason: input.reason,
            }
          : {}),
        ...(input.internalNotes !== undefined
          ? { internalNotes: input.internalNotes }
          : {}),
        lastModifiedByUserId: actorUserId ?? null,
      },
      include: {
        customer: true,
        pet: true,
        service: true,
        resource: true,
      },
    });

    // Record status history
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: current.status,
        toStatus: input.status,
        reason: input.reason || `Status diubah menjadi ${input.status}`,
        changedByUserId: actorUserId ?? null,
        actorUserId: actorUserId ?? null,
      },
    });

    // Record audit log
    await logBookingAudit(tx, {
      bookingId: booking.id,
      actorUserId: actorUserId ?? null,
      action: "UPDATE_STATUS",
      beforeData: { status: current.status },
      afterData: { status: updated.status },
      reason: input.reason ?? null,
    });

    // Enqueue Google Calendar Outbox Sync Job if cancelled
    if (isCancelling) {
      await enqueueCalendarSyncJob(tx, {
        businessId: booking.businessId,
        operationType: "CANCEL",
        bookingId: booking.id,
      });
    }

    return updated;
  });
}

/**
 * Updates internal notes for a booking.
 */
export async function updateBookingInternalNotes(params: {
  bookingId: string;
  internalNotes: string;
  actorUserId?: string | null;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
  });

  if (!booking) {
    throw new BookingValidationError("Reservasi tidak ditemukan.", 404, "NOT_FOUND");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: {
        internalNotes: params.internalNotes,
        lastModifiedByUserId: params.actorUserId ?? null,
      },
    });

    await logBookingAudit(tx, {
      bookingId: booking.id,
      actorUserId: params.actorUserId ?? null,
      action: "UPDATE_INTERNAL_NOTES",
      beforeData: { internalNotes: booking.internalNotes },
      afterData: { internalNotes: updated.internalNotes },
    });

    return updated;
  });
}

/**
 * Creates a walk-in or admin booking using core engine rules and advisory locks.
 */
export async function createWalkInBooking(
  params: AdminWalkInInput,
  actorUserId?: string | null
) {
  // 1. Fetch Service
  const service = await prisma.service.findUnique({
    where: { id: params.serviceId },
    select: {
      id: true,
      name: true,
      price: true,
      durationMinutes: true,
      bufferMinutes: true,
      isActive: true,
      businessId: true,
    },
  });

  if (!service || !service.isActive) {
    throw new BookingValidationError("Layanan tidak ditemukan atau tidak aktif.", 404, "NOT_FOUND");
  }

  // 2. Fetch Business, Settings, Operating Hours, and Resources
  const business = await prisma.business.findUnique({
    where: { id: service.businessId },
    include: {
      settings: true,
      operatingHours: {
        include: {
          breaks: true,
        },
      },
      bookingResources: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!business || !business.isActive) {
    throw new BookingValidationError("Bisnis grooming tidak aktif atau tidak ditemukan.", 404, "NOT_FOUND");
  }

  const resource = business.bookingResources[0];
  if (!resource) {
    throw new SlotUnavailableError("Stasiun grooming tidak tersedia saat ini.", 503, "NO_RESOURCE");
  }

  // 3. Time Calculations
  const defaultBuffer = business.settings?.defaultBufferMinutes ?? 15;
  const effectiveBufferMinutes = defaultBuffer + (service.bufferMinutes ?? 0);

  const startAt = jakartaDateToUtc(params.date, params.time);
  if (isNaN(startAt.getTime())) {
    throw new BookingValidationError("Format tanggal atau waktu tidak valid.", 400, "BAD_REQUEST");
  }

  const serviceEndAt = new Date(startAt.getTime() + service.durationMinutes * 60 * 1000);
  const occupancyEndAt = new Date(
    startAt.getTime() + (service.durationMinutes + effectiveBufferMinutes) * 60 * 1000
  );
  const endAt = serviceEndAt;

  // 4. Operating Hours & Breaks check
  const dayOfWeek = getDayOfWeekJakarta(params.date);
  const opHour = business.operatingHours.find((h) => h.dayOfWeek === dayOfWeek);

  if (!opHour || !opHour.isOpen) {
    throw new SlotUnavailableError("Salon grooming tutup pada hari yang dipilih.", 409, "CLOSED");
  }

  const openMin = timeToMinutes(opHour.openTime);
  const closeMin = timeToMinutes(opHour.closeTime);
  const slotStartMin = timeToMinutes(params.time);
  const serviceEndMin = slotStartMin + service.durationMinutes;
  const occupancyEndMin = serviceEndMin + effectiveBufferMinutes;

  if (slotStartMin < openMin || occupancyEndMin > closeMin) {
    throw new SlotUnavailableError("Waktu reservasi berada di luar jam operasional.", 409, "OUTSIDE_HOURS");
  }

  for (const brk of opHour.breaks) {
    const breakStart = timeToMinutes(brk.startTime);
    const breakEnd = timeToMinutes(brk.endTime);
    if (isIntervalOverlapping(slotStartMin, occupancyEndMin, breakStart, breakEnd)) {
      throw new SlotUnavailableError("Waktu reservasi bertabrakan dengan jam istirahat.", 409, "BREAK");
    }
  }

  // 5. Transaction with PostgreSQL Advisory Lock
  return prisma.$transaction(async (tx) => {
    await acquireResourceAdvisoryLock(tx, resource.id);

    // Overlapping active bookings check
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
        startAt: { lt: occupancyEndAt },
        occupancyEndAt: { gt: startAt },
      },
    });

    if (overlappingBooking) {
      throw new SlotUnavailableError(
        "Slot waktu yang dipilih sudah terisi atau bertabrakan dengan reservasi lain.",
        409,
        "SLOT_UNAVAILABLE"
      );
    }

    // Overlapping active resource blocks check
    const overlappingBlock = await tx.resourceBlock.findFirst({
      where: {
        resourceId: resource.id,
        cancelledAt: null,
        startAt: { lt: occupancyEndAt },
        endAt: { gt: startAt },
      },
    });

    if (overlappingBlock) {
      throw new SlotUnavailableError(
        "Slot waktu yang dipilih telah diblokir untuk keperluan operasional.",
        409,
        "SLOT_UNAVAILABLE"
      );
    }

    // Overlapping Google Calendar external busy intervals check
    const overlappingExternal = await tx.calendarExternalBusyInterval.findFirst({
      where: {
        calendarConnection: {
          businessId: business.id,
          status: "ACTIVE",
        },
        isBusy: true,
        startAt: { lt: occupancyEndAt },
        endAt: { gt: startAt },
      },
    });

    if (overlappingExternal) {
      throw new SlotUnavailableError(
        "Slot waktu yang dipilih bertabrakan dengan jadwal sibuk kalender Google pengelola.",
        409,
        "SLOT_UNAVAILABLE"
      );
    }

    // Upsert Customer
    const normalizedPhone = params.customer.phone.replace(/[\s()-]/g, "");
    let customer = await tx.customer.findFirst({
      where: {
        businessId: business.id,
        phone: normalizedPhone,
      },
    });

    if (customer) {
      customer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          name: params.customer.name,
          ...(params.customer.email ? { email: params.customer.email } : {}),
        },
      });
    } else {
      customer = await tx.customer.create({
        data: {
          businessId: business.id,
          name: params.customer.name,
          phone: normalizedPhone,
          email: params.customer.email || null,
        },
      });
    }

    // Create Pet
    const pet = await tx.pet.create({
      data: {
        customerId: customer.id,
        name: params.pet.name,
        type: params.pet.type,
        breed: params.pet.breed || null,
        age: params.pet.age ?? null,
        notes: params.pet.notes || null,
      },
    });

    // Generate unique code
    let bookingCode = generateBookingCode(startAt);
    let attempts = 0;
    while ((await tx.booking.findUnique({ where: { bookingCode } })) && attempts < 10) {
      bookingCode = generateBookingCode(startAt);
      attempts++;
    }

    const initialStatus = params.autoConfirm
      ? BookingStatus.CONFIRMED
      : BookingStatus.PENDING;

    const source = params.source || "WALK_IN";

    // Create Booking
    const booking = await tx.booking.create({
      data: {
        businessId: business.id,
        resourceId: resource.id,
        customerId: customer.id,
        petId: pet.id,
        serviceId: service.id,
        bookingCode,
        startAt,
        endAt,
        serviceEndAt,
        occupancyEndAt,
        serviceNameSnapshot: service.name,
        serviceDurationSnapshot: service.durationMinutes,
        servicePriceSnapshot: service.price,
        totalPrice: service.price,
        source,
        notes: params.customerNotes || null,
        customerNotes: params.customerNotes || null,
        internalNotes: params.internalNotes || null,
        status: initialStatus,
        lastModifiedByUserId: actorUserId ?? null,
      },
      include: {
        customer: true,
        pet: true,
        service: true,
        resource: true,
      },
    });

    // Create Status History
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: null,
        toStatus: initialStatus,
        reason: `Reservasi ${source} dibuat oleh admin/staf`,
        changedByUserId: actorUserId ?? null,
        actorUserId: actorUserId ?? null,
      },
    });

    // Generate Guest Access Token
    const { rawToken, tokenHash } = generateGuestToken();
    await tx.bookingAccessToken.create({
      data: {
        bookingId: booking.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000),
      },
    });

    // Record Audit Log
    await logBookingAudit(tx, {
      bookingId: booking.id,
      actorUserId: actorUserId ?? null,
      action: "CREATE_WALK_IN_BOOKING",
      afterData: {
        bookingCode: booking.bookingCode,
        source: booking.source,
        totalPrice: Number(booking.totalPrice),
        status: booking.status,
      },
      reason: `Reservasi ${source} dibuat oleh admin`,
    });

    // Enqueue Google Calendar Outbox Sync Job
    await enqueueCalendarSyncJob(tx, {
      businessId: business.id,
      operationType: "CREATE",
      bookingId: booking.id,
    });

    return {
      booking,
      manageToken: rawToken,
    };
  });
}

/**
 * Returns calendar events (bookings + resource blocks) for a bounded range.
 */
export async function getCalendarEvents(params: {
  businessId: string;
  startStr: string;
  endStr: string;
  resourceId?: string;
}) {
  const { businessId, startStr, endStr, resourceId } = params;

  const startUtc = jakartaDateToUtc(startStr, "00:00");
  const endUtc = new Date(jakartaDateToUtc(endStr, "00:00").getTime() + 24 * 3600 * 1000 - 1);

  // Maximum range guard: 62 days
  const maxRangeMs = 62 * 24 * 3600 * 1000;
  if (endUtc.getTime() - startUtc.getTime() > maxRangeMs) {
    throw new BookingValidationError("Rentang kalender maksimal adalah 62 hari.", 400, "RANGE_TOO_LARGE");
  }

  const [bookings, blockedTimes] = await Promise.all([
    prisma.booking.findMany({
      where: {
        businessId,
        ...(resourceId ? { resourceId } : {}),
        startAt: { lte: endUtc },
        occupancyEndAt: { gte: startUtc },
      },
      include: {
        customer: true,
        pet: true,
        service: true,
        resource: true,
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.resourceBlock.findMany({
      where: {
        businessId,
        cancelledAt: null,
        ...(resourceId ? { resourceId } : {}),
        startAt: { lte: endUtc },
        endAt: { gte: startUtc },
      },
      include: {
        resource: true,
      },
      orderBy: { startAt: "asc" },
    }),
  ]);

  return {
    bookings,
    blockedTimes,
  };
}
