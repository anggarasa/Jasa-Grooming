import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { getAvailabilityQuerySchema } from "./schemas";
import {
  generateDateSlots,
  getDayOfWeekJakarta,
  jakartaDateToUtc,
} from "./slot-generator";
import { AvailabilityResult } from "./types";
import { queryGoogleFreeBusy } from "@/modules/integrations/google/google-freebusy.service";

export class AvailabilityError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
    public code = "BAD_REQUEST"
  ) {
    super(message);
    this.name = "AvailabilityError";
  }
}

export interface AvailabilityOptions {
  excludeBookingId?: string;
  now?: Date;
  ignoreMinAdvance?: boolean;
}

/**
 * Service to compute available booking slots for a given service and date in Asia/Jakarta timezone.
 */
export async function getAvailableSlotsForDate(
  serviceId: string,
  dateStr: string,
  options?: AvailabilityOptions
): Promise<AvailabilityResult> {
  const validated = getAvailabilityQuerySchema.safeParse({ serviceId, date: dateStr });
  if (!validated.success) {
    throw new AvailabilityError("Parameter permintaan tidak valid.", 400, "VALIDATION_ERROR");
  }

  // 1. Fetch Service
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      bufferMinutes: true,
      isActive: true,
      businessId: true,
    },
  });

  if (!service || !service.isActive) {
    throw new AvailabilityError("Layanan tidak ditemukan atau tidak aktif.", 404, "NOT_FOUND");
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
    throw new AvailabilityError("Bisnis grooming tidak aktif atau tidak ditemukan.", 404, "NOT_FOUND");
  }

  const defaultBuffer = business.settings?.defaultBufferMinutes ?? 15;
  const effectiveBufferMinutes = defaultBuffer + (service.bufferMinutes ?? 0);
  const totalOccupancyMinutes = service.durationMinutes + effectiveBufferMinutes;

  const resource = business.bookingResources[0];
  if (!resource) {
    throw new AvailabilityError("Stasiun grooming tidak tersedia saat ini.", 503, "NO_RESOURCE");
  }

  // Check if booking is globally enabled
  if (business.settings && !business.settings.bookingEnabled) {
    return {
      date: dateStr,
      serviceId: service.id,
      serviceName: service.name,
      durationMinutes: service.durationMinutes,
      bufferMinutes: service.bufferMinutes,
      effectiveBufferMinutes,
      totalOccupancyMinutes,
      resourceId: resource.id,
      resourceName: resource.name,
      isOpen: false,
      slots: [],
    };
  }

  // 3. Determine Operating Hours for this day of week
  const dayOfWeek = getDayOfWeekJakarta(dateStr);
  const opHour = business.operatingHours.find((h) => h.dayOfWeek === dayOfWeek);

  if (!opHour || !opHour.isOpen) {
    return {
      date: dateStr,
      serviceId: service.id,
      serviceName: service.name,
      durationMinutes: service.durationMinutes,
      bufferMinutes: service.bufferMinutes,
      effectiveBufferMinutes,
      totalOccupancyMinutes,
      resourceId: resource.id,
      resourceName: resource.name,
      isOpen: false,
      slots: [],
    };
  }

  // 4. Fetch Active Bookings overlapping with this day in Jakarta
  // Expand query window slightly to account for buffers and boundaries
  const dayStartUtc = jakartaDateToUtc(dateStr, "00:00");
  const dayEndUtc = new Date(dayStartUtc.getTime() + 24 * 3600 * 1000 + 4 * 3600 * 1000); // +28h window

  const activeBookings = await prisma.booking.findMany({
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
      ...(options?.excludeBookingId ? { id: { not: options.excludeBookingId } } : {}),
      startAt: { lt: dayEndUtc },
      occupancyEndAt: { gt: dayStartUtc },
    },
    select: {
      startAt: true,
      occupancyEndAt: true,
    },
  });

  // Fetch Active Resource Blocks for this resource & window
  const activeBlocks = await prisma.resourceBlock.findMany({
    where: {
      resourceId: resource.id,
      cancelledAt: null,
      startAt: { lt: dayEndUtc },
      endAt: { gt: dayStartUtc },
    },
    select: {
      startAt: true,
      endAt: true,
      reason: true,
    },
  });

  // Fetch cached Google Calendar external busy intervals
  const externalIntervals = await prisma.calendarExternalBusyInterval.findMany({
    where: {
      calendarConnection: {
        businessId: business.id,
        status: "ACTIVE",
      },
      isBusy: true,
      startAt: { lt: dayEndUtc },
      endAt: { gt: dayStartUtc },
    },
    select: {
      startAt: true,
      endAt: true,
    },
  });

  // Query live Google Calendar FreeBusy (with fail-closed support)
  const freeBusy = await queryGoogleFreeBusy({
    businessId: business.id,
    timeMin: dayStartUtc,
    timeMax: dayEndUtc,
  });

  const mergedExternalBusy = [
    ...externalIntervals,
    ...freeBusy.busyIntervals.map((fb) => ({
      startAt: fb.start,
      endAt: fb.end,
    })),
  ];

  // 5. Generate slots using interval generator
  const slots = generateDateSlots({
    dateStr,
    openTime: opHour.openTime,
    closeTime: opHour.closeTime,
    slotIntervalMinutes: business.settings?.bookingIntervalMinutes ?? 30,
    durationMinutes: service.durationMinutes,
    effectiveBufferMinutes,
    breaks: opHour.breaks.map((b) => ({
      startTime: b.startTime,
      endTime: b.endTime,
    })),
    existingBookings: activeBookings,
    resourceBlocks: activeBlocks,
    externalBusyIntervals: mergedExternalBusy,
    now: options?.now,
    minimumAdvanceMinutes: options?.ignoreMinAdvance
      ? 0
      : (business.settings?.minimumAdvanceMinutes ?? 60),
    maximumAdvanceDays: business.settings?.maximumAdvanceDays ?? 30,
  });

  return {
    date: dateStr,
    serviceId: service.id,
    serviceName: service.name,
    durationMinutes: service.durationMinutes,
    bufferMinutes: service.bufferMinutes,
    effectiveBufferMinutes,
    totalOccupancyMinutes,
    resourceId: resource.id,
    resourceName: resource.name,
    isOpen: true,
    slots,
  };
}
