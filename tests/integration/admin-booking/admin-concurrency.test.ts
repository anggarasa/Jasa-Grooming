import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import prisma from "@/lib/prisma";
import { POST as postGuestBooking } from "@/app/api/bookings/route";
import { POST as postAdminWalkIn } from "@/app/api/admin/bookings/route";
import { POST as postReschedule } from "@/app/api/admin/bookings/[id]/reschedule/route";
import { POST as postCreateResourceBlock } from "@/app/api/admin/resource-blocks/route";
import { jakartaDateToUtc } from "@/modules/availability/slot-generator";

const mockAdmin = {
  id: "admin-concurrency-id",
  name: "Admin Concurrency",
  email: "admin-conc@pawcare.test",
  role: Role.ADMIN,
  tokenVersion: 0,
  isActive: true,
  lastLoginAt: new Date(),
  passwordChangedAt: null,
};

vi.mock("@/lib/auth/server", () => ({
  getCurrentUser: vi.fn(async () => mockAdmin),
  requireAuth: vi.fn(async () => mockAdmin),
  requireRole: vi.fn(async () => mockAdmin),
  assertOwner: vi.fn(async () => mockAdmin),
}));

function getFutureWeekday(daysAhead: number): string {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  if (futureDate.getDay() === 0) {
    futureDate.setDate(futureDate.getDate() + 1);
  }
  return futureDate.toISOString().slice(0, 10);
}

describe("PostgreSQL Concurrency Tests (Admin & Guest Mutations)", () => {
  let activeServiceId: string;
  let activeResourceId: string;
  const createdBookingCodes: string[] = [];
  const createdBlockIds: string[] = [];

  beforeAll(async () => {
    const service = await prisma.service.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    if (!service) throw new Error("Layanan aktif tidak ditemukan.");
    activeServiceId = service.id;

    const resource = await prisma.bookingResource.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    if (!resource) throw new Error("Stasiun grooming tidak ditemukan.");
    activeResourceId = resource.id;
  });

  afterAll(async () => {
    if (createdBookingCodes.length > 0) {
      await prisma.booking.deleteMany({
        where: { bookingCode: { in: createdBookingCodes } },
      });
    }
    if (createdBlockIds.length > 0) {
      await prisma.resourceBlock.deleteMany({
        where: { id: { in: createdBlockIds } },
      });
    }
  });

  it("Konkurensi 1: 2 Walk-in admin simultan pada slot sama — tepat 1 sukses (201) dan 1 ditolak (409)", async () => {
    const testDate = getFutureWeekday(18);
    const targetTime = "09:00";

    const slotStart = jakartaDateToUtc(testDate, targetTime);
    const slotEnd = new Date(slotStart.getTime() + 120 * 60 * 1000);
    await prisma.booking.deleteMany({
      where: {
        resourceId: activeResourceId,
        startAt: { lt: slotEnd },
        occupancyEndAt: { gt: slotStart },
      },
    });

    const payloadA = {
      serviceId: activeServiceId,
      date: testDate,
      time: targetTime,
      customer: {
        name: "Walk-in Tamu 1",
        phone: "081299990001",
      },
      pet: {
        name: "Pet One",
        type: "Kucing",
      },
      source: "WALK_IN",
      autoConfirm: true,
    };

    const payloadB = {
      serviceId: activeServiceId,
      date: testDate,
      time: targetTime,
      customer: {
        name: "Walk-in Tamu 2",
        phone: "081299990002",
      },
      pet: {
        name: "Pet Two",
        type: "Anjing",
      },
      source: "WALK_IN",
      autoConfirm: true,
    };

    const reqA = new NextRequest("http://localhost:3000/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify(payloadA),
    });

    const reqB = new NextRequest("http://localhost:3000/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify(payloadB),
    });

    // Eksekusi bersamaan (race condition)
    const [resA, resB] = await Promise.all([postAdminWalkIn(reqA), postAdminWalkIn(reqB)]);
    const jsonA = await resA.json();
    const jsonB = await resB.json();

    const statuses = [resA.status, resB.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    const successJson = resA.status === 201 ? jsonA : jsonB;
    createdBookingCodes.push(successJson.data.booking.bookingCode);
  });

  it("Konkurensi 2: Reschedule vs Tamu Publik simultan pada slot sama — tepat 1 berhasil dan 1 ditolak (409)", async () => {
    const origDate = getFutureWeekday(19);
    const targetDate = getFutureWeekday(20);
    const targetTime = "10:00";

    // Clean up test slots
    const targetStart = jakartaDateToUtc(targetDate, targetTime);
    const targetEnd = new Date(targetStart.getTime() + 120 * 60 * 1000);
    const origStart = jakartaDateToUtc(origDate, "10:00");
    const origEnd = new Date(origStart.getTime() + 120 * 60 * 1000);

    await prisma.booking.deleteMany({
      where: {
        resourceId: activeResourceId,
        OR: [
          { startAt: { lt: targetEnd }, occupancyEndAt: { gt: targetStart } },
          { startAt: { lt: origEnd }, occupancyEndAt: { gt: origStart } },
        ],
      },
    });
    await prisma.resourceBlock.deleteMany({
      where: {
        resourceId: activeResourceId,
        OR: [
          { startAt: { lt: targetEnd }, endAt: { gt: targetStart } },
          { startAt: { lt: origEnd }, endAt: { gt: origStart } },
        ],
      },
    });

    // Buat booking awal untuk di-reschedule
    const initialReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: origDate,
        time: "10:00",
        customer: { name: "Reschedule Candidate", phone: "081233331111" },
        pet: { name: "Snowy", type: "Kucing" },
      }),
    });
    const initRes = await postGuestBooking(initialReq);
    expect(initRes.status).toBe(201);
    const initJson = await initRes.json();
    const targetBookingId = initJson.booking.id;
    createdBookingCodes.push(initJson.bookingCode);

    // Sekarang persiapkan 2 request berlomba merebut slot targetDate @ targetTime:
    // Request 1: Admin reschedule targetBookingId ke slot targetDate @ targetTime
    const reschedReq = new NextRequest(
      `http://localhost:3000/api/admin/bookings/${targetBookingId}/reschedule`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
        body: JSON.stringify({
          date: targetDate,
          time: targetTime,
          reason: "Reschedule adu cepat",
        }),
      }
    );
    const reschedParam = { params: Promise.resolve({ id: targetBookingId }) };

    // Request 2: Tamu publik memesan slot targetDate @ targetTime
    const guestReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: targetDate,
        time: targetTime,
        customer: { name: "Guest Competitor", phone: "081233332222" },
        pet: { name: "Fluffy", type: "Anjing" },
      }),
    });

    const [reschedRes, guestRes] = await Promise.all([
      postReschedule(reschedReq, reschedParam),
      postGuestBooking(guestReq),
    ]);

    const statuses = [reschedRes.status, guestRes.status];
    const hasSuccess = statuses.includes(200) || statuses.includes(201);
    const hasConflict = statuses.includes(409);
    expect(hasSuccess).toBe(true);
    expect(hasConflict).toBe(true);

    if (guestRes.status === 201) {
      const gJson = await guestRes.json();
      createdBookingCodes.push(gJson.bookingCode);
    }
  });

  it("Konkurensi 3: Block Time manual vs Tamu Publik simultan — tepat 1 berhasil dan 1 ditolak (409)", async () => {
    const testDate = getFutureWeekday(21);
    const targetTime = "14:00";

    const slotStart = jakartaDateToUtc(testDate, targetTime);
    const slotEnd = new Date(slotStart.getTime() + 120 * 60 * 1000);

    // Clean up test slots
    await prisma.resourceBlock.deleteMany({
      where: {
        resourceId: activeResourceId,
        startAt: { lt: slotEnd },
        endAt: { gt: slotStart },
      },
    });
    await prisma.booking.deleteMany({
      where: {
        resourceId: activeResourceId,
        startAt: { lt: slotEnd },
        occupancyEndAt: { gt: slotStart },
      },
    });

    const blockStartAt = slotStart.toISOString();
    const blockEndAt = new Date(
      slotStart.getTime() + 90 * 60 * 1000
    ).toISOString();

    const blockReq = new NextRequest("http://localhost:3000/api/admin/resource-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({
        resourceId: activeResourceId,
        startAt: blockStartAt,
        endAt: blockEndAt,
        reason: "Darurat perbaikan pipa air stasiun",
      }),
    });

    const guestReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: testDate,
        time: targetTime,
        customer: { name: "Guest Concurrent Block", phone: "081299993333" },
        pet: { name: "Bruno", type: "Anjing" },
      }),
    });

    const [blockRes, guestRes] = await Promise.all([
      postCreateResourceBlock(blockReq),
      postGuestBooking(guestReq),
    ]);

    const statuses = [blockRes.status, guestRes.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    if (blockRes.status === 201) {
      const bJson = await blockRes.json();
      createdBlockIds.push(bJson.data.id);
    }
    if (guestRes.status === 201) {
      const gJson = await guestRes.json();
      createdBookingCodes.push(gJson.bookingCode);
    }
  });
});
