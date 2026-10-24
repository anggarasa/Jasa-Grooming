import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import {
  getDayOfWeekJakarta,
  jakartaDateToUtc,
  timeToMinutes,
  isIntervalOverlapping,
} from "@/modules/availability/slot-generator";
import { acquireResourceAdvisoryLock } from "./concurrency-lock";
import { logBookingAudit } from "./audit.service";
import { isTerminalStatus } from "./state-machine";
import { SlotUnavailableError, BookingValidationError } from "./booking.service";
import { enqueueCalendarSyncJob } from "@/modules/integrations/google/google-sync-outbox.service";

export interface RescheduleBookingParams {
  bookingId: string;
  newDate: string; // YYYY-MM-DD
  newTime: string; // HH:mm
  reason: string;
  actorUserId?: string | null;
}

export async function rescheduleBooking(params: RescheduleBookingParams) {
  const { bookingId, newDate, newTime, reason, actorUserId } = params;

  // 1. Fetch Booking with Business, Settings, Operating Hours, Service, and Resource
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      business: {
        include: {
          settings: true,
          operatingHours: {
            include: {
              breaks: true,
            },
          },
        },
      },
      service: true,
      resource: true,
      customer: true,
      pet: true,
    },
  });

  if (!booking) {
    throw new BookingValidationError("Reservasi tidak ditemukan.", 404, "NOT_FOUND");
  }

  // 2. Validate current status: cannot reschedule terminal booking
  if (isTerminalStatus(booking.status)) {
    throw new BookingValidationError(
      `Reservasi dengan status ${booking.status} tidak dapat di-reschedule.`,
      400,
      "INVALID_STATUS"
    );
  }

  // 3. Calculate new timestamps using snapshot durations
  const durationMinutes = booking.serviceDurationSnapshot;
  const defaultBuffer = booking.business.settings?.defaultBufferMinutes ?? 15;
  const effectiveBufferMinutes = defaultBuffer + (booking.service.bufferMinutes ?? 0);

  const newStartAt = jakartaDateToUtc(newDate, newTime);
  if (isNaN(newStartAt.getTime())) {
    throw new BookingValidationError("Format tanggal atau waktu baru tidak valid.", 400, "BAD_REQUEST");
  }

  const newServiceEndAt = new Date(newStartAt.getTime() + durationMinutes * 60 * 1000);
  const newOccupancyEndAt = new Date(
    newStartAt.getTime() + (durationMinutes + effectiveBufferMinutes) * 60 * 1000
  );
  const newEndAt = newServiceEndAt;

  // 4. Validate Operating Hours & Breaks
  const dayOfWeek = getDayOfWeekJakarta(newDate);
  const opHour = booking.business.operatingHours.find((h) => h.dayOfWeek === dayOfWeek);

  if (!opHour || !opHour.isOpen) {
    throw new SlotUnavailableError("Salon grooming tutup pada hari yang dipilih.", 409, "CLOSED");
  }

  const openMin = timeToMinutes(opHour.openTime);
  const closeMin = timeToMinutes(opHour.closeTime);
  const slotStartMin = timeToMinutes(newTime);
  const serviceEndMin = slotStartMin + durationMinutes;
  const occupancyEndMin = serviceEndMin + effectiveBufferMinutes;

  if (slotStartMin < openMin || occupancyEndMin > closeMin) {
    throw new SlotUnavailableError("Waktu baru berada di luar jam operasional.", 409, "OUTSIDE_HOURS");
  }

  for (const brk of opHour.breaks) {
    const breakStart = timeToMinutes(brk.startTime);
    const breakEnd = timeToMinutes(brk.endTime);
    if (isIntervalOverlapping(slotStartMin, occupancyEndMin, breakStart, breakEnd)) {
      throw new SlotUnavailableError("Waktu baru bertabrakan dengan jam istirahat salon.", 409, "BREAK");
    }
  }

  // 5. Execute Atomic Transaction with PostgreSQL Advisory Lock
  return prisma.$transaction(async (tx) => {
    // Acquire resource advisory lock
    await acquireResourceAdvisoryLock(tx, booking.resourceId);

    // Re-check current booking status inside transaction lock to prevent race condition
    const freshBooking = await tx.booking.findUnique({
      where: { id: booking.id },
      select: { status: true },
    });
    if (!freshBooking || isTerminalStatus(freshBooking.status)) {
      throw new BookingValidationError(
        `Reservasi dengan status ${freshBooking?.status ?? "NOT_FOUND"} tidak dapat di-reschedule.`,
        400,
        "INVALID_STATUS"
      );
    }

    // Overlapping booking check excluding THIS booking
    const overlappingBooking = await tx.booking.findFirst({
      where: {
        resourceId: booking.resourceId,
        id: { not: booking.id },
        status: {
          in: [
            BookingStatus.CONFIRMED,
            BookingStatus.PENDING,
            BookingStatus.CHECKED_IN,
            BookingStatus.IN_PROGRESS,
          ],
        },
        startAt: { lt: newOccupancyEndAt },
        occupancyEndAt: { gt: newStartAt },
      },
      select: {
        id: true,
        bookingCode: true,
      },
    });

    if (overlappingBooking) {
      throw new SlotUnavailableError(
        `Slot waktu baru bertabrakan dengan reservasi lain (${overlappingBooking.bookingCode}).`,
        409,
        "SLOT_UNAVAILABLE"
      );
    }

    // Overlapping active resource blocks check
    const overlappingBlock = await tx.resourceBlock.findFirst({
      where: {
        resourceId: booking.resourceId,
        cancelledAt: null,
        startAt: { lt: newOccupancyEndAt },
        endAt: { gt: newStartAt },
      },
      select: {
        id: true,
        reason: true,
      },
    });

    if (overlappingBlock) {
      throw new SlotUnavailableError(
        `Slot waktu baru bertabrakan dengan blokir waktu operasional ("${overlappingBlock.reason}").`,
        409,
        "SLOT_UNAVAILABLE"
      );
    }

    // Overlapping Google Calendar external busy intervals check
    const overlappingExternal = await tx.calendarExternalBusyInterval.findFirst({
      where: {
        calendarConnection: {
          businessId: booking.business.id,
          status: "ACTIVE",
        },
        isBusy: true,
        startAt: { lt: newOccupancyEndAt },
        endAt: { gt: newStartAt },
      },
      select: {
        id: true,
        summary: true,
      },
    });

    if (overlappingExternal) {
      throw new SlotUnavailableError(
        `Slot waktu baru bertabrakan dengan jadwal sibuk kalender Google pengelola.`,
        409,
        "SLOT_UNAVAILABLE"
      );
    }

    const beforeData = {
      startAt: booking.startAt.toISOString(),
      endAt: booking.endAt.toISOString(),
      occupancyEndAt: booking.occupancyEndAt.toISOString(),
    };

    // Update Booking
    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: {
        startAt: newStartAt,
        endAt: newEndAt,
        serviceEndAt: newServiceEndAt,
        occupancyEndAt: newOccupancyEndAt,
        lastModifiedByUserId: actorUserId ?? null,
      },
      include: {
        customer: true,
        pet: true,
        service: true,
        resource: true,
      },
    });

    // Record Reschedule History
    await tx.bookingRescheduleHistory.create({
      data: {
        bookingId: booking.id,
        previousStartAt: booking.startAt,
        previousEndAt: booking.endAt,
        newStartAt,
        newEndAt,
        reason,
        actorUserId: actorUserId ?? null,
      },
    });

    // Record Status History
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: booking.status,
        toStatus: updated.status,
        reason: `Reschedule: ${reason}`,
        changedByUserId: actorUserId ?? null,
        actorUserId: actorUserId ?? null,
      },
    });

    // Record Audit Log
    await logBookingAudit(tx, {
      bookingId: booking.id,
      actorUserId: actorUserId ?? null,
      action: "RESCHEDULE_BOOKING",
      beforeData,
      afterData: {
        startAt: newStartAt.toISOString(),
        endAt: newEndAt.toISOString(),
        occupancyEndAt: newOccupancyEndAt.toISOString(),
      },
      reason,
    });

    // Enqueue Google Calendar Outbox Sync Job
    await enqueueCalendarSyncJob(tx, {
      businessId: booking.business.id,
      operationType: "RESCHEDULE",
      bookingId: booking.id,
    });

    return updated;
  });
}
