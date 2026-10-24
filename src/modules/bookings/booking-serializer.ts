import { BookingStatus } from "@prisma/client";
import { AdminBookingDetailItem, BookingListItem } from "./admin-ui.types";

/**
 * Raw types representing data returned by Prisma queries before RSC serialization.
 */
export interface RawBookingCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
}

export interface RawBookingPet {
  id: string;
  name: string;
  type: string;
  breed?: string | null;
  age?: number | null;
  notes?: string | null;
}

export interface RawBookingService {
  id: string;
  name: string;
  durationMinutes: number;
  price?: unknown;
}

export interface RawBookingResource {
  id: string;
  name: string;
}

export interface RawBookingStatusHistory {
  id: string;
  bookingId: string;
  fromStatus?: BookingStatus | null;
  toStatus: BookingStatus;
  reason?: string | null;
  createdAt: Date | string;
}

export interface RawBookingRescheduleHistory {
  id: string;
  bookingId: string;
  previousStartAt: Date | string;
  newStartAt: Date | string;
  reason?: string | null;
  createdAt: Date | string;
}

export interface RawBookingAuditLog {
  id: string;
  bookingId?: string | null;
  action: string;
  reason?: string | null;
  createdAt: Date | string;
}

export interface RawBookingListItem {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  source?: string | null;
  startAt: Date | string;
  endAt: Date | string;
  totalPrice: unknown;
  customer?: RawBookingCustomer | null;
  pet?: RawBookingPet | null;
  service?: RawBookingService | null;
  resource?: RawBookingResource | null;
}

export interface RawAdminBookingDetail extends RawBookingListItem {
  customerId?: string | null;
  petId?: string | null;
  serviceId: string;
  resourceId?: string | null;
  serviceSnapshotName?: string | null;
  serviceSnapshotDuration?: number | null;
  serviceNameSnapshot?: string | null;
  serviceDurationSnapshot?: number | null;
  servicePriceSnapshot?: unknown;
  customerNotes?: string | null;
  internalNotes?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  statusHistories?: RawBookingStatusHistory[] | null;
  rescheduleHistories?: RawBookingRescheduleHistory[] | null;
  auditLogs?: RawBookingAuditLog[] | null;
}

/**
 * Memeriksa apakah suatu nilai merupakan objek Decimal (misal Prisma.Decimal / Decimal.js).
 */
export function isDecimal(
  value: unknown
): value is { toNumber: () => number; toString: () => string } {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as { toNumber?: unknown }).toNumber === "function"
  );
}

/**
 * Mengonversi nilai Decimal, string, atau number ke tipe number JavaScript murni.
 */
export function serializeDecimalToNumber(value: unknown): number;
export function serializeDecimalToNumber(
  value: unknown,
  allowNullable: true
): number | null;
export function serializeDecimalToNumber(
  value: unknown,
  allowNullable = false
): number | null {
  if (value === null || value === undefined) {
    return allowNullable ? null : 0;
  }
  if (isDecimal(value)) {
    try {
      const num = value.toNumber();
      return isNaN(num) ? (allowNullable ? null : 0) : num;
    } catch {
      return allowNullable ? null : 0;
    }
  }
  if (typeof value === "number") {
    return isNaN(value) ? (allowNullable ? null : 0) : value;
  }
  const parsed = Number(value);
  return isNaN(parsed) ? (allowNullable ? null : 0) : parsed;
}

/**
 * Mengonversi nilai Date atau tanggal string ke format ISO 8601 string yang aman diserialisasi.
 */
export function serializeDateToIso(value: unknown): string;
export function serializeDateToIso(
  value: unknown,
  allowNullable: true
): string | null;
export function serializeDateToIso(
  value: unknown,
  allowNullable = false
): string | null {
  if (!value) {
    return allowNullable ? null : "";
  }
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return allowNullable ? null : "";
    }
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return String(value);
}

/**
 * Serializer rekursif generik yang mengubah seluruh instance Decimal menjadi number
 * dan Date menjadi ISO string untuk memastikan plain object murni bebas dari prototype custom.
 */
export function serializePlainObject<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (isDecimal(input)) {
    try {
      const num = input.toNumber();
      return (isNaN(num) ? 0 : num) as unknown as T;
    } catch {
      return 0 as unknown as T;
    }
  }

  if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      return "" as unknown as T;
    }
    return input.toISOString() as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => serializePlainObject(item)) as unknown as T;
  }

  if (typeof input === "object" && input.constructor === Object) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input)) {
      result[key] = serializePlainObject(val);
    }
    return result as T;
  }

  return input;
}

/**
 * Mengonversi objek booking mentah dari Prisma (termasuk relasi dan historis)
 * menjadi AdminBookingDetailItem plain object yang aman dioper ke Client Component.
 */
export function serializeAdminBookingDetail(
  raw: RawAdminBookingDetail
): AdminBookingDetailItem {
  if (!raw) {
    throw new Error("Data booking tidak boleh kosong untuk serialisasi.");
  }

  return {
    id: raw.id,
    bookingCode: raw.bookingCode,
    status: raw.status,
    source: raw.source || "PUBLIC_GUEST",
    startAt: serializeDateToIso(raw.startAt),
    endAt: serializeDateToIso(raw.endAt),
    totalPrice: serializeDecimalToNumber(raw.totalPrice),
    customerId: raw.customerId ?? null,
    petId: raw.petId ?? null,
    serviceId: raw.serviceId,
    resourceId: raw.resourceId ?? null,
    serviceSnapshotName: raw.serviceSnapshotName ?? null,
    serviceSnapshotDuration: raw.serviceSnapshotDuration ?? null,
    serviceNameSnapshot: raw.serviceNameSnapshot ?? null,
    serviceDurationSnapshot: raw.serviceDurationSnapshot ?? null,
    servicePriceSnapshot: serializeDecimalToNumber(raw.servicePriceSnapshot, true),
    customerNotes: raw.customerNotes ?? null,
    internalNotes: raw.internalNotes ?? null,
    cancellationReason: raw.cancellationReason ?? null,
    cancelledAt: serializeDateToIso(raw.cancelledAt, true),
    createdAt: serializeDateToIso(raw.createdAt),
    updatedAt: serializeDateToIso(raw.updatedAt),
    customer: raw.customer
      ? {
          id: raw.customer.id,
          name: raw.customer.name,
          phone: raw.customer.phone,
          email: raw.customer.email ?? null,
        }
      : null,
    pet: raw.pet
      ? {
          id: raw.pet.id,
          name: raw.pet.name,
          type: raw.pet.type,
          breed: raw.pet.breed ?? null,
          age: raw.pet.age ?? null,
          notes: raw.pet.notes ?? null,
        }
      : null,
    service: raw.service
      ? {
          id: raw.service.id,
          name: raw.service.name,
          durationMinutes: raw.service.durationMinutes,
          price: serializeDecimalToNumber(raw.service.price, true),
        }
      : null,
    resource: raw.resource
      ? {
          id: raw.resource.id,
          name: raw.resource.name,
        }
      : null,
    statusHistories: Array.isArray(raw.statusHistories)
      ? raw.statusHistories.map((h) => ({
          id: h.id,
          bookingId: h.bookingId,
          fromStatus: h.fromStatus ?? null,
          toStatus: h.toStatus,
          reason: h.reason ?? null,
          createdAt: serializeDateToIso(h.createdAt),
        }))
      : [],
    rescheduleHistories: Array.isArray(raw.rescheduleHistories)
      ? raw.rescheduleHistories.map((rh) => ({
          id: rh.id,
          bookingId: rh.bookingId,
          previousStartAt: serializeDateToIso(rh.previousStartAt),
          newStartAt: serializeDateToIso(rh.newStartAt),
          reason: rh.reason || "Perubahan jadwal",
          createdAt: serializeDateToIso(rh.createdAt),
        }))
      : [],
    auditLogs: Array.isArray(raw.auditLogs)
      ? raw.auditLogs.map((log) => ({
          id: log.id,
          bookingId: log.bookingId,
          action: log.action,
          reason: log.reason ?? null,
          createdAt: serializeDateToIso(log.createdAt),
        }))
      : [],
  };
}

/**
 * Mengonversi ringkasan booking Prisma ke BookingListItem plain object.
 */
export function serializeBookingListItem(
  raw: RawBookingListItem
): BookingListItem {
  if (!raw) {
    throw new Error("Data booking tidak boleh kosong untuk serialisasi.");
  }

  return {
    id: raw.id,
    bookingCode: raw.bookingCode,
    status: raw.status,
    source: raw.source || "PUBLIC_GUEST",
    startAt: serializeDateToIso(raw.startAt),
    endAt: serializeDateToIso(raw.endAt),
    totalPrice: serializeDecimalToNumber(raw.totalPrice),
    customer: raw.customer
      ? {
          id: raw.customer.id,
          name: raw.customer.name,
          phone: raw.customer.phone,
          email: raw.customer.email ?? null,
        }
      : null,
    pet: raw.pet
      ? {
          id: raw.pet.id,
          name: raw.pet.name,
          type: raw.pet.type,
          breed: raw.pet.breed ?? null,
          age: raw.pet.age ?? null,
          notes: raw.pet.notes ?? null,
        }
      : null,
    service: raw.service
      ? {
          id: raw.service.id,
          name: raw.service.name,
          durationMinutes: raw.service.durationMinutes,
          price: serializeDecimalToNumber(raw.service.price, true),
        }
      : null,
    resource: raw.resource
      ? {
          id: raw.resource.id,
          name: raw.resource.name,
        }
      : null,
  };
}
