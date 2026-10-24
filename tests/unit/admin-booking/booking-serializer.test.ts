import { describe, it, expect } from "vitest";
import { Prisma, BookingStatus } from "@prisma/client";
import {
  isDecimal,
  serializeDecimalToNumber,
  serializeDateToIso,
  serializePlainObject,
  serializeAdminBookingDetail,
  serializeBookingListItem,
} from "@/modules/bookings/booking-serializer";

describe("Booking Serializer (RSC Plain Object Safety)", () => {
  it("mendeteksi Prisma.Decimal dan objek dengan method toNumber", () => {
    const decimal = new Prisma.Decimal("150000.50");
    expect(isDecimal(decimal)).toBe(true);
    expect(isDecimal(150000)).toBe(false);
    expect(isDecimal("150000")).toBe(false);
    expect(isDecimal(null)).toBe(false);
    expect(isDecimal(undefined)).toBe(false);
  });

  it("mengonversi Decimal ke tipe number murni", () => {
    const decimal = new Prisma.Decimal("175000.00");
    expect(serializeDecimalToNumber(decimal)).toBe(175000);
    expect(serializeDecimalToNumber("50000")).toBe(50000);
    expect(serializeDecimalToNumber(120000)).toBe(120000);
    expect(serializeDecimalToNumber(null)).toBe(0);
    expect(serializeDecimalToNumber(null, true)).toBeNull();
    expect(serializeDecimalToNumber(undefined, true)).toBeNull();
  });

  it("mengonversi Date ke ISO string", () => {
    const date = new Date("2026-10-24T10:00:00.000Z");
    expect(serializeDateToIso(date)).toBe("2026-10-24T10:00:00.000Z");
    expect(serializeDateToIso("2026-10-24T10:00:00.000Z")).toBe("2026-10-24T10:00:00.000Z");
    expect(serializeDateToIso(null, true)).toBeNull();
  });

  it("serializePlainObject mengonversi Decimal dan Date rekursif pada struktur bersarang", () => {
    const rawData = {
      id: "book-1",
      totalPrice: new Prisma.Decimal("250000.00"),
      createdAt: new Date("2026-10-24T08:00:00.000Z"),
      service: {
        id: "svc-1",
        price: new Prisma.Decimal("250000.00"),
      },
      tags: ["vip", "walkin"],
      nullField: null,
    };

    const serialized = serializePlainObject(rawData);

    expect(typeof serialized.totalPrice).toBe("number");
    expect(serialized.totalPrice).toBe(250000);
    expect(typeof serialized.createdAt).toBe("string");
    expect(serialized.createdAt).toBe("2026-10-24T08:00:00.000Z");
    expect(typeof serialized.service.price).toBe("number");
    expect(serialized.service.price).toBe(250000);
  });

  it("serializeAdminBookingDetail memetakan Prisma Booking dengan relasi ke AdminBookingDetailItem plain object", () => {
    const rawPrismaBooking = {
      id: "cm12345678",
      bookingCode: "GRM-20261024-TEST",
      status: BookingStatus.CONFIRMED,
      source: "ONLINE_PORTAL",
      startAt: new Date("2026-10-24T09:00:00.000Z"),
      endAt: new Date("2026-10-24T10:00:00.000Z"),
      totalPrice: new Prisma.Decimal("180000.00"),
      servicePriceSnapshot: new Prisma.Decimal("180000.00"),
      serviceNameSnapshot: "Grooming Lengkap",
      serviceDurationSnapshot: 60,
      customerId: "cust-1",
      petId: "pet-1",
      serviceId: "srv-1",
      resourceId: "res-1",
      customerNotes: "Mohon pelan-pelan",
      internalNotes: "Pelanggan reguler",
      cancellationReason: null,
      cancelledAt: null,
      createdAt: new Date("2026-10-23T12:00:00.000Z"),
      updatedAt: new Date("2026-10-23T12:00:00.000Z"),
      customer: {
        id: "cust-1",
        name: "Andi Saputra",
        phone: "081234567890",
        email: "andi@example.com",
      },
      pet: {
        id: "pet-1",
        name: "Chiko",
        type: "Anjing",
        breed: "Golden Retriever",
        age: 3,
        notes: "Sangat ramah",
      },
      service: {
        id: "srv-1",
        name: "Grooming Lengkap",
        durationMinutes: 60,
        price: new Prisma.Decimal("180000.00"),
      },
      resource: {
        id: "res-1",
        name: "Station 1",
      },
      statusHistories: [
        {
          id: "hist-1",
          bookingId: "cm12345678",
          fromStatus: BookingStatus.PENDING,
          toStatus: BookingStatus.CONFIRMED,
          reason: "Dikonfirmasi via WhatsApp",
          createdAt: new Date("2026-10-23T12:30:00.000Z"),
        },
      ],
      rescheduleHistories: [
        {
          id: "resc-1",
          bookingId: "cm12345678",
          previousStartAt: new Date("2026-10-24T08:00:00.000Z"),
          newStartAt: new Date("2026-10-24T09:00:00.000Z"),
          reason: "Permintaan pelanggan",
          createdAt: new Date("2026-10-23T13:00:00.000Z"),
        },
      ],
      auditLogs: [
        {
          id: "log-1",
          bookingId: "cm12345678",
          action: "UPDATE_STATUS",
          reason: "Auto confirm",
          createdAt: new Date("2026-10-23T12:30:00.000Z"),
        },
      ],
    };

    const result = serializeAdminBookingDetail(rawPrismaBooking);

    // Verifikasi semua field Decimal terkonversi menjadi number murni
    expect(typeof result.totalPrice).toBe("number");
    expect(result.totalPrice).toBe(180000);
    expect(typeof result.servicePriceSnapshot).toBe("number");
    expect(result.servicePriceSnapshot).toBe(180000);
    expect(typeof result.service?.price).toBe("number");
    expect(result.service?.price).toBe(180000);

    // Verifikasi tanggal terkonversi menjadi string ISO
    expect(result.startAt).toBe("2026-10-24T09:00:00.000Z");
    expect(result.endAt).toBe("2026-10-24T10:00:00.000Z");
    expect(result.statusHistories?.[0].createdAt).toBe("2026-10-23T12:30:00.000Z");
    expect(result.rescheduleHistories?.[0].newStartAt).toBe("2026-10-24T09:00:00.000Z");

    // Verifikasi plain object: JSON round-trip identik
    const roundTripped = JSON.parse(JSON.stringify(result));
    expect(roundTripped).toEqual(result);
  });

  it("serializeBookingListItem mengonversi Decimal ke number pada ringkasan booking", () => {
    const rawListItem = {
      id: "cm12345678",
      bookingCode: "GRM-20261024-TEST",
      status: BookingStatus.PENDING,
      source: "WALK_IN",
      startAt: new Date("2026-10-24T14:00:00.000Z"),
      endAt: new Date("2026-10-24T15:00:00.000Z"),
      totalPrice: new Prisma.Decimal("120000.00"),
      customer: {
        id: "cust-2",
        name: "Siti Rahma",
        phone: "08987654321",
        email: null,
      },
      pet: {
        id: "pet-2",
        name: "Mochi",
        type: "Kucing",
        breed: "Anggora",
      },
      service: {
        id: "srv-2",
        name: "Mandi Kucing",
        durationMinutes: 45,
        price: new Prisma.Decimal("120000.00"),
      },
      resource: null,
    };

    const result = serializeBookingListItem(rawListItem);

    expect(typeof result.totalPrice).toBe("number");
    expect(result.totalPrice).toBe(120000);
    expect(typeof result.service?.price).toBe("number");
    expect(result.service?.price).toBe(120000);
    expect(result.startAt).toBe("2026-10-24T14:00:00.000Z");
  });

  it("menangani edge case invalid Date dan NaN secara aman tanpa melempar exception", () => {
    const invalidDate = new Date("invalid date string");
    expect(serializeDateToIso(invalidDate)).toBe("");
    expect(serializeDateToIso(invalidDate, true)).toBeNull();

    expect(serializeDecimalToNumber(NaN)).toBe(0);
    expect(serializeDecimalToNumber(NaN, true)).toBeNull();
    expect(serializeDecimalToNumber("bukan-angka")).toBe(0);
    expect(serializeDecimalToNumber("bukan-angka", true)).toBeNull();

    const throwingDecimal = {
      toNumber: () => {
        throw new Error("Conversion error");
      },
    };
    expect(serializeDecimalToNumber(throwingDecimal)).toBe(0);
    expect(serializeDecimalToNumber(throwingDecimal, true)).toBeNull();

    const plainObj = serializePlainObject({
      badDate: invalidDate,
      brokenDecimal: throwingDecimal,
    });
    expect(plainObj.badDate).toBe("");
    expect(plainObj.brokenDecimal).toBe(0);
  });
});
