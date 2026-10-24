import crypto from "crypto";
import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export class TokenAuthError extends Error {
  constructor(
    message: string,
    public statusCode = 401,
    public code = "UNAUTHORIZED"
  ) {
    super(message);
    this.name = "TokenAuthError";
  }
}

/**
 * Creates SHA-256 hash of raw access token.
 */
export function hashGuestToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
}

/**
 * Generates high-entropy raw token and its SHA-256 hash.
 */
export function generateGuestToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashGuestToken(rawToken);
  return { rawToken, tokenHash };
}

export interface ManagedBookingDto {
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
  customerNotes?: string | null;
  customer: {
    name: string;
    phone: string;
    email: string | null;
  };
  pet: {
    name: string;
    type: string;
    breed: string | null;
    age: number | null;
    notes: string | null;
  };
  stationName: string;
  canCancel: boolean;
  cancellationWindowHours: number;
  createdAt: string;
}

/**
 * Verifies guest access token and returns sanitized booking management DTO.
 */
export async function getBookingByGuestToken(
  rawToken: string
): Promise<ManagedBookingDto> {
  if (!rawToken || rawToken.trim().length === 0) {
    throw new TokenAuthError("Token akses reservasi tidak disediakan.", 400, "BAD_REQUEST");
  }

  const tokenHash = hashGuestToken(rawToken);

  const tokenRecord = await prisma.bookingAccessToken.findUnique({
    where: { tokenHash },
    include: {
      booking: {
        include: {
          customer: true,
          pet: true,
          service: true,
          resource: true,
          business: {
            include: {
              settings: true,
            },
          },
        },
      },
    },
  });

  if (!tokenRecord) {
    throw new TokenAuthError("Token akses tidak valid atau tidak ditemukan.", 404, "NOT_FOUND");
  }

  if (tokenRecord.revokedAt) {
    throw new TokenAuthError("Token akses reservasi telah dicabut.", 403, "FORBIDDEN");
  }

  if (tokenRecord.expiresAt.getTime() <= Date.now()) {
    throw new TokenAuthError("Token akses reservasi telah kedaluwarsa.", 401, "TOKEN_EXPIRED");
  }

  const b = tokenRecord.booking;
  const cancellationWindowHours = b.business.settings?.cancellationWindowHours ?? 24;

  // Determine if booking can be cancelled by guest
  const now = Date.now();
  const cutoffTime = b.startAt.getTime() - cancellationWindowHours * 3600 * 1000;
  const isCancellableStatus =
    b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PENDING;
  const canCancel = isCancellableStatus && now < cutoffTime;

  return {
    id: b.id,
    bookingCode: b.bookingCode,
    status: b.status,
    startAt: b.startAt.toISOString(),
    endAt: b.endAt.toISOString(),
    serviceEndAt: b.serviceEndAt.toISOString(),
    occupancyEndAt: b.occupancyEndAt.toISOString(),
    serviceName: b.serviceNameSnapshot || b.service.name,
    durationMinutes: b.serviceDurationSnapshot || b.service.durationMinutes,
    totalPrice: Number(b.totalPrice),
    customerNotes: b.customerNotes || b.notes,
    customer: {
      name: b.customer.name,
      phone: b.customer.phone,
      email: b.customer.email,
    },
    pet: {
      name: b.pet.name,
      type: b.pet.type,
      breed: b.pet.breed,
      age: b.pet.age,
      notes: b.pet.notes,
    },
    stationName: b.resource.name,
    canCancel,
    cancellationWindowHours,
    createdAt: b.createdAt.toISOString(),
  };
}
