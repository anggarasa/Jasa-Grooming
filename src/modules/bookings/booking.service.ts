import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import {
  getDayOfWeekJakarta,
  jakartaDateToUtc,
  timeToMinutes,
  isIntervalOverlapping,
} from "@/modules/availability/slot-generator";
import { CreateBookingInput, createBookingSchema } from "./schemas";
import { acquireResourceAdvisoryLock } from "./concurrency-lock";
import { generateBookingCode } from "./code-generator";
import { generateGuestToken } from "./token.service";
import {
  checkIdempotency,
  computeRequestFingerprint,
  saveIdempotencyRecord,
  hashIdempotencyKey,
  IdempotencyError,
} from "./idempotency.service";
import { enqueueCalendarSyncJob } from "@/modules/integrations/google/google-sync-outbox.service";

export class SlotUnavailableError extends Error {
  constructor(
    message = "Slot waktu yang dipilih sudah terisi atau tidak tersedia.",
    public statusCode = 409,
    public code = "SLOT_UNAVAILABLE"
  ) {
    super(message);
    this.name = "SlotUnavailableError";
  }
}

export class BookingValidationError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
    public code = "BAD_REQUEST"
  ) {
    super(message);
    this.name = "BookingValidationError";
  }
}

export interface BookingResponseData {
  bookingCode: string;
  manageToken: string;
  booking: {
    id: string;
    bookingCode: string;
    status: BookingStatus;
    startAt: string;
    endAt: string;
    serviceEndAt: string;
    occupancyEndAt: string;
    serviceName: string;
    durationMinutes: number;
    totalPrice: number;
    customer: {
      name: string;
      phone: string;
      email: string | null;
    };
    pet: {
      name: string;
      type: string;
      breed: string | null;
    };
    stationName: string;
  };
}

/**
 * Creates a customer booking with strict PostgreSQL concurrency protection,
 * server-side duration & price snapshots, idempotency handling, and guest access token.
 */
export async function createReservation(
  rawInput: CreateBookingInput,
  idempotencyKey?: string | null
): Promise<BookingResponseData> {
  const input = createBookingSchema.parse(rawInput);

  // 1. Check Idempotency if key is present
  const fingerprint = computeRequestFingerprint(input);
  if (idempotencyKey && idempotencyKey.trim().length > 0) {
    const idempotency = await checkIdempotency(idempotencyKey, fingerprint);
    if (idempotency.isDuplicate && idempotency.cachedResponse) {
      return idempotency.cachedResponse as BookingResponseData;
    }
  }

  // 2. Fetch Service
  const service = await prisma.service.findUnique({
    where: { id: input.serviceId },
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
    throw new BookingValidationError("Layanan yang dipilih tidak ditemukan atau sudah tidak aktif.", 404, "NOT_FOUND");
  }

  // 3. Fetch Business, Settings, Operating Hours, and Resources
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

  if (business.settings && !business.settings.bookingEnabled) {
    throw new SlotUnavailableError("Layanan reservasi online sedang dinonaktifkan.", 409, "BOOKING_DISABLED");
  }

  const resource = business.bookingResources[0];
  if (!resource) {
    throw new SlotUnavailableError("Stasiun grooming tidak tersedia saat ini.", 503, "NO_RESOURCE");
  }

  // 4. Time & Interval Calculations
  const defaultBuffer = business.settings?.defaultBufferMinutes ?? 15;
  const effectiveBufferMinutes = defaultBuffer + (service.bufferMinutes ?? 0);

  const startAt = jakartaDateToUtc(input.date, input.time);
  if (isNaN(startAt.getTime())) {
    throw new BookingValidationError("Format tanggal atau waktu tidak valid.", 400, "BAD_REQUEST");
  }
  const serviceEndAt = new Date(startAt.getTime() + service.durationMinutes * 60 * 1000);
  const occupancyEndAt = new Date(
    startAt.getTime() + (service.durationMinutes + effectiveBufferMinutes) * 60 * 1000
  );
  const endAt = serviceEndAt;

  const now = new Date();

  // Past check
  if (startAt.getTime() <= now.getTime()) {
    throw new SlotUnavailableError("Waktu reservasi sudah lewat.", 409, "PAST");
  }

  // Minimum advance notice check
  const minAdvanceMinutes = business.settings?.minimumAdvanceMinutes ?? 60;
  if (startAt.getTime() < now.getTime() + minAdvanceMinutes * 60 * 1000) {
    throw new SlotUnavailableError(
      `Reservasi harus dilakukan minimal ${minAdvanceMinutes} menit sebelumnya.`,
      409,
      "MIN_ADVANCE"
    );
  }

  // Maximum advance booking days check
  const maxAdvanceDays = business.settings?.maximumAdvanceDays ?? 30;
  const maxAllowedTimestamp = now.getTime() + (maxAdvanceDays + 1) * 24 * 3600 * 1000;
  if (startAt.getTime() > maxAllowedTimestamp) {
    throw new BookingValidationError(
      `Reservasi hanya dapat dilakukan maksimal ${maxAdvanceDays} hari ke depan.`,
      400,
      "MAX_ADVANCE"
    );
  }

  // Operating Hours check
  const dayOfWeek = getDayOfWeekJakarta(input.date);
  const opHour = business.operatingHours.find((h) => h.dayOfWeek === dayOfWeek);

  if (!opHour || !opHour.isOpen) {
    throw new SlotUnavailableError("Salon grooming tutup pada hari yang dipilih.", 409, "CLOSED");
  }

  const openMin = timeToMinutes(opHour.openTime);
  const closeMin = timeToMinutes(opHour.closeTime);
  const slotStartMin = timeToMinutes(input.time);
  const serviceEndMin = slotStartMin + service.durationMinutes;
  const occupancyEndMin = serviceEndMin + effectiveBufferMinutes;

  if (slotStartMin < openMin || occupancyEndMin > closeMin) {
    throw new SlotUnavailableError("Waktu reservasi berada di luar jam operasional.", 409, "OUTSIDE_HOURS");
  }

  // Break periods check
  for (const brk of opHour.breaks) {
    const breakStart = timeToMinutes(brk.startTime);
    const breakEnd = timeToMinutes(brk.endTime);
    if (isIntervalOverlapping(slotStartMin, occupancyEndMin, breakStart, breakEnd)) {
      throw new SlotUnavailableError("Waktu reservasi bertabrakan dengan jam istirahat.", 409, "BREAK");
    }
  }

  // 5. Atomic Transaction with PostgreSQL Advisory Lock
  const result = await prisma.$transaction(async (tx) => {
    // Acquire resource-level exclusive advisory lock for duration of transaction
    await acquireResourceAdvisoryLock(tx, resource.id);

    // Re-check idempotency inside lock in case a concurrent request with same key completed
    if (idempotencyKey && idempotencyKey.trim().length > 0) {
      const keyHash = hashIdempotencyKey(idempotencyKey);
      const inTxExisting = await tx.bookingIdempotency.findUnique({
        where: { keyHash },
      });
      if (inTxExisting && inTxExisting.expiresAt.getTime() > Date.now()) {
        if (inTxExisting.requestFingerprint !== fingerprint) {
          throw new IdempotencyError(
            "Kunci idempotensi ini telah digunakan dengan parameter permintaan yang berbeda.",
            422,
            "IDEMPOTENCY_MISMATCH"
          );
        }
        if (inTxExisting.responsePayload) {
          return inTxExisting.responsePayload as unknown as BookingResponseData;
        }
      }
    }

    // Re-check for overlapping active bookings inside the lock
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

    // Check for overlapping active resource blocks inside the lock
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

    // Check for overlapping Google Calendar external busy intervals
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

    // Upsert Customer (find by normalized phone within business)
    const normalizedPhone = input.customer.phone.replace(/[\s()-]/g, "");
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
          name: input.customer.name,
          ...(input.customer.email ? { email: input.customer.email } : {}),
        },
      });
    } else {
      customer = await tx.customer.create({
        data: {
          businessId: business.id,
          name: input.customer.name,
          phone: normalizedPhone,
          email: input.customer.email || null,
        },
      });
    }

    // Create Pet
    const pet = await tx.pet.create({
      data: {
        customerId: customer.id,
        name: input.pet.name,
        type: input.pet.type,
        breed: input.pet.breed || null,
        age: input.pet.age ?? null,
        notes: input.pet.notes || null,
      },
    });

    // Generate unique booking code
    let bookingCode = generateBookingCode(startAt);
    let codeAttempts = 0;
    while ((await tx.booking.findUnique({ where: { bookingCode } })) && codeAttempts < 10) {
      bookingCode = generateBookingCode(startAt);
      codeAttempts++;
    }

    const initialStatus = business.settings?.autoConfirmBooking
      ? BookingStatus.CONFIRMED
      : BookingStatus.PENDING;

    const notesText = input.customerNotes || input.notes || null;

    // Create Booking with snapshots
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
        notes: notesText,
        customerNotes: notesText,
        status: initialStatus,
      },
    });

    // Create Booking Status History
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: null,
        toStatus: initialStatus,
        reason: "Reservasi online dibuat oleh pelanggan",
      },
    });

    // Generate Guest Access Token
    const { rawToken, tokenHash } = generateGuestToken();
    await tx.bookingAccessToken.create({
      data: {
        bookingId: booking.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000), // 90 days validity
      },
    });

    // Enqueue Google Calendar Outbox Sync Job
    await enqueueCalendarSyncJob(tx, {
      businessId: business.id,
      operationType: "CREATE",
      bookingId: booking.id,
    });

    const responseData: BookingResponseData = {
      bookingCode: booking.bookingCode,
      manageToken: rawToken,
      booking: {
        id: booking.id,
        bookingCode: booking.bookingCode,
        status: booking.status,
        startAt: booking.startAt.toISOString(),
        endAt: booking.endAt.toISOString(),
        serviceEndAt: booking.serviceEndAt.toISOString(),
        occupancyEndAt: booking.occupancyEndAt.toISOString(),
        serviceName: booking.serviceNameSnapshot,
        durationMinutes: booking.serviceDurationSnapshot,
        totalPrice: Number(booking.totalPrice),
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        },
        pet: {
          name: pet.name,
          type: pet.type,
          breed: pet.breed,
        },
        stationName: resource.name,
      },
    };

    // Save Idempotency Record if key provided
    if (idempotencyKey && idempotencyKey.trim().length > 0) {
      await saveIdempotencyRecord(
        tx,
        idempotencyKey,
        fingerprint,
        booking.id,
        responseData
      );
    }

    return responseData;
  });

  return result;
}
