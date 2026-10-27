import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { Role, BookingStatus } from "@prisma/client";
import prisma from "@backend/lib/prisma";
import { POST as postGuestBooking } from "@backend/api/bookings/route";
import { POST as postAdminWalkIn } from "@backend/api/admin/bookings/route";
import { POST as postReschedule } from "@backend/api/admin/bookings/[id]/reschedule/route";
import { POST as postCancelBooking } from "@backend/api/admin/bookings/[id]/cancel/route";
import { PATCH as patchUpdateStatus } from "@backend/api/admin/bookings/[id]/status/route";
import { POST as postCreateResourceBlock } from "@backend/api/admin/resource-blocks/route";
import { jakartaDateToUtc } from "@backend/modules/availability/slot-generator";

const mockAdmin = {
  id: "admin-deep-concurrency-id",
  name: "Admin Deep Concurrency",
  email: "admin-deep@pawcare.test",
  role: Role.ADMIN,
  tokenVersion: 0,
  isActive: true,
  lastLoginAt: new Date(),
  passwordChangedAt: null,
};

vi.mock("@backend/lib/auth/server", () => ({
  getCurrentUser: vi.fn(async () => mockAdmin),
  requireAuth: vi.fn(async () => mockAdmin),
  requireRole: vi.fn(async () => mockAdmin),
  assertOwner: vi.fn(async () => mockAdmin),
}));

function getFutureWeekday(daysAhead: number): string {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  while (futureDate.getDay() === 0) {
    futureDate.setDate(futureDate.getDate() + 1);
  }
  return futureDate.toISOString().slice(0, 10);
}

describe("PostgreSQL Deep Concurrency Tests (10 Contention Scenarios)", () => {
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
    if (!resource) throw new Error("Stasiun grooming aktif tidak ditemukan.");
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

  // =========================================================================
  // Skenario A: 2 Customer booking slot yang sama serentak
  // =========================================================================
  it("Skenario A: 2 customer booking slot yang sama serentak -> tepat 1 berhasil (201), 1 ditolak (409)", async () => {
    const testDate = getFutureWeekday(5);
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

    const reqA = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: testDate,
        time: targetTime,
        customer: { name: "Customer Paralel A", phone: "081299990101" },
        pet: { name: "Mochi", type: "Kucing" },
      }),
    });

    const reqB = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: testDate,
        time: targetTime,
        customer: { name: "Customer Paralel B", phone: "081299990102" },
        pet: { name: "Oreo", type: "Anjing" },
      }),
    });

    const [resA, resB] = await Promise.all([postGuestBooking(reqA), postGuestBooking(reqB)]);
    const jsonA = await resA.json();
    const jsonB = await resB.json();

    const statuses = [resA.status, resB.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    const successJson = resA.status === 201 ? jsonA : jsonB;
    const failJson = resA.status === 409 ? jsonA : jsonB;

    createdBookingCodes.push(successJson.bookingCode);
    expect(failJson.error.code).toBe("SLOT_UNAVAILABLE");
  });

  // =========================================================================
  // Skenario B: Customer booking vs Admin walk-in serentak di slot sama
  // =========================================================================
  it("Skenario B: Customer booking vs Admin walk-in serentak di slot sama -> tepat 1 berhasil, 1 ditolak", async () => {
    const testDate = getFutureWeekday(6);
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

    const guestReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: testDate,
        time: targetTime,
        customer: { name: "Guest User B", phone: "081299990201" },
        pet: { name: "Pompom", type: "Anjing" },
      }),
    });

    const adminReq = new NextRequest("http://localhost:3000/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: testDate,
        time: targetTime,
        customer: { name: "Admin Walk-in B", phone: "081299990202" },
        pet: { name: "Luna", type: "Kucing" },
        source: "WALK_IN",
        autoConfirm: true,
      }),
    });

    const [resGuest, resAdmin] = await Promise.all([
      postGuestBooking(guestReq),
      postAdminWalkIn(adminReq),
    ]);

    const statuses = [resGuest.status, resAdmin.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    if (resGuest.status === 201) {
      const gJson = await resGuest.json();
      createdBookingCodes.push(gJson.bookingCode);
    } else {
      const aJson = await resAdmin.json();
      createdBookingCodes.push(aJson.data.booking.bookingCode);
    }
  });

  // =========================================================================
  // Skenario C: Admin reschedule vs Booking tamu baru di slot sama
  // =========================================================================
  it("Skenario C: Admin reschedule vs Booking tamu baru di slot sama -> tidak ada tabrakan", async () => {
    const origDate = getFutureWeekday(7);
    const targetDate = getFutureWeekday(8);
    const targetTime = "10:00";

    const targetStart = jakartaDateToUtc(targetDate, targetTime);
    const targetEnd = new Date(targetStart.getTime() + 120 * 60 * 1000);
    const origStart = jakartaDateToUtc(origDate, "09:30");
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

    // Buat booking awal untuk di-reschedule
    const initReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: origDate,
        time: "09:30",
        customer: { name: "Initial Reschedule Guest", phone: "081299990301" },
        pet: { name: "Milo", type: "Anjing" },
      }),
    });
    const initRes = await postGuestBooking(initReq);
    expect(initRes.status).toBe(201);
    const initJson = await initRes.json();
    const candidateBookingId = initJson.booking.id;
    createdBookingCodes.push(initJson.bookingCode);

    // Reschedule vs Tamu baru berlomba di target slot
    const reschedReq = new NextRequest(
      `http://localhost:3000/api/admin/bookings/${candidateBookingId}/reschedule`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
        body: JSON.stringify({
          date: targetDate,
          time: targetTime,
          reason: "Klien minta ganti jadwal",
        }),
      }
    );
    const reschedParam = { params: Promise.resolve({ id: candidateBookingId }) };

    const newGuestReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: targetDate,
        time: targetTime,
        customer: { name: "Competitor Guest C", phone: "081299990302" },
        pet: { name: "Coco", type: "Kucing" },
      }),
    });

    const [reschedRes, newGuestRes] = await Promise.all([
      postReschedule(reschedReq, reschedParam),
      postGuestBooking(newGuestReq),
    ]);

    const statuses = [reschedRes.status, newGuestRes.status];
    const hasSuccess = statuses.includes(200) || statuses.includes(201);
    const hasConflict = statuses.includes(409);
    expect(hasSuccess).toBe(true);
    expect(hasConflict).toBe(true);

    if (newGuestRes.status === 201) {
      const gJson = await newGuestRes.json();
      createdBookingCodes.push(gJson.bookingCode);
    }
  });

  // =========================================================================
  // Skenario D: Resource block vs Booking tamu di slot sama
  // =========================================================================
  it("Skenario D: Resource block vs Booking tamu di slot sama -> tidak ada overlap", async () => {
    const testDate = getFutureWeekday(9);
    const targetTime = "13:30";

    const blockStartAt = jakartaDateToUtc(testDate, targetTime).toISOString();
    const blockEndAt = new Date(
      jakartaDateToUtc(testDate, targetTime).getTime() + 90 * 60 * 1000
    ).toISOString();

    const blockReq = new NextRequest("http://localhost:3000/api/admin/resource-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({
        resourceId: activeResourceId,
        startAt: blockStartAt,
        endAt: blockEndAt,
        reason: "Pemeliharaan sterilisasi stasiun",
      }),
    });

    const guestReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: testDate,
        time: targetTime,
        customer: { name: "Guest D", phone: "081299990401" },
        pet: { name: "Simba", type: "Kucing" },
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

  // =========================================================================
  // Skenario E: 2 Admin reschedule ke slot kosong yang sama serentak
  // =========================================================================
  it("Skenario E: 2 admin reschedule ke slot kosong yang sama serentak -> tepat 1 berhasil", async () => {
    const origDateE1 = getFutureWeekday(10);
    const origDateE2 = getFutureWeekday(11);
    const targetDateE = getFutureWeekday(12);
    const targetTimeE = "14:00";

    // Bersihkan target slot
    const targetStart = jakartaDateToUtc(targetDateE, targetTimeE);
    const targetEnd = new Date(targetStart.getTime() + 120 * 60 * 1000);
    await prisma.booking.deleteMany({
      where: {
        resourceId: activeResourceId,
        startAt: { lt: targetEnd },
        occupancyEndAt: { gt: targetStart },
      },
    });

    // Buat 2 booking terpisah
    const b1Req = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: origDateE1,
        time: "09:00",
        customer: { name: "Client E1", phone: "081299990501" },
        pet: { name: "PetE1", type: "Kucing" },
      }),
    });
    const b2Req = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: origDateE2,
        time: "09:00",
        customer: { name: "Client E2", phone: "081299990502" },
        pet: { name: "PetE2", type: "Anjing" },
      }),
    });

    const [b1Res, b2Res] = await Promise.all([postGuestBooking(b1Req), postGuestBooking(b2Req)]);
    const b1Json = await b1Res.json();
    const b2Json = await b2Res.json();
    createdBookingCodes.push(b1Json.bookingCode, b2Json.bookingCode);

    // Keduanya serentak berlomba reschedule ke targetDateE @ targetTimeE
    const r1Req = new NextRequest(
      `http://localhost:3000/api/admin/bookings/${b1Json.booking.id}/reschedule`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
        body: JSON.stringify({
          date: targetDateE,
          time: targetTimeE,
          reason: "Admin 1 reschedule race",
        }),
      }
    );
    const r2Req = new NextRequest(
      `http://localhost:3000/api/admin/bookings/${b2Json.booking.id}/reschedule`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
        body: JSON.stringify({
          date: targetDateE,
          time: targetTimeE,
          reason: "Admin 2 reschedule race",
        }),
      }
    );

    const [r1Res, r2Res] = await Promise.all([
      postReschedule(r1Req, { params: Promise.resolve({ id: b1Json.booking.id }) }),
      postReschedule(r2Req, { params: Promise.resolve({ id: b2Json.booking.id }) }),
    ]);

    const statuses = [r1Res.status, r2Res.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);
  });

  // =========================================================================
  // Skenario F: Pembatalan serentak vs reschedule
  // =========================================================================
  it("Skenario F: Pembatalan serentak vs reschedule -> transaksi konsisten tanpa deadlock", async () => {
    const testDate = getFutureWeekday(13);
    const newDate = getFutureWeekday(14);

    const bReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: testDate,
        time: "10:00",
        customer: { name: "Client F", phone: "081299990601" },
        pet: { name: "PetF", type: "Kucing" },
      }),
    });
    const bRes = await postGuestBooking(bReq);
    const bJson = await bRes.json();
    const bookingId = bJson.booking.id;
    createdBookingCodes.push(bJson.bookingCode);

    // Cancel vs Reschedule serentak
    const cancelReq = new NextRequest(
      `http://localhost:3000/api/admin/bookings/${bookingId}/cancel`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
        body: JSON.stringify({ reason: "Pembatalan oleh klien darurat" }),
      }
    );
    const reschedReq = new NextRequest(
      `http://localhost:3000/api/admin/bookings/${bookingId}/reschedule`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
        body: JSON.stringify({ date: newDate, time: "14:00", reason: "Ganti jadwal siang" }),
      }
    );

    const [cancelRes, reschedRes] = await Promise.all([
      postCancelBooking(cancelReq, { params: Promise.resolve({ id: bookingId }) }),
      postReschedule(reschedReq, { params: Promise.resolve({ id: bookingId }) }),
    ]);

    // Kedua request harus selesai dengan HTTP terdefinisi (200 atau 400)
    expect([200, 400]).toContain(cancelRes.status);
    expect([200, 400]).toContain(reschedRes.status);

    // Status final di database harus valid
    const finalBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
    expect(finalBooking).toBeDefined();
    expect([BookingStatus.CANCELLED, BookingStatus.PENDING, BookingStatus.CONFIRMED]).toContain(
      finalBooking!.status
    );
  });

  // =========================================================================
  // Skenario G: Mutasi status konkuren
  // =========================================================================
  it("Skenario G: Mutasi status konkuren -> transisi state machine valid tanpa anomali DB", async () => {
    const testDate = getFutureWeekday(15);

    const bReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: testDate,
        time: "10:00",
        customer: { name: "Client G", phone: "081299990701" },
        pet: { name: "PetG", type: "Anjing" },
      }),
    });
    const bRes = await postGuestBooking(bReq);
    const bJson = await bRes.json();
    const bookingId = bJson.booking.id;
    createdBookingCodes.push(bJson.bookingCode);

    // 2 admin memutasi status serentak: Admin 1 -> CONFIRMED, Admin 2 -> CANCELLED
    const m1Req = new NextRequest(
      `http://localhost:3000/api/admin/bookings/${bookingId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
        body: JSON.stringify({ status: BookingStatus.CONFIRMED }),
      }
    );
    const m2Req = new NextRequest(
      `http://localhost:3000/api/admin/bookings/${bookingId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
        body: JSON.stringify({ status: BookingStatus.CANCELLED, reason: "Batal mendadak" }),
      }
    );

    const [res1, res2] = await Promise.all([
      patchUpdateStatus(m1Req, { params: Promise.resolve({ id: bookingId }) }),
      patchUpdateStatus(m2Req, { params: Promise.resolve({ id: bookingId }) }),
    ]);

    // Keduanya selesai tanpa exception internal
    expect([200, 400]).toContain(res1.status);
    expect([200, 400]).toContain(res2.status);

    const histories = await prisma.bookingStatusHistory.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
    });
    expect(histories.length).toBeGreaterThanOrEqual(1);
  });

  // =========================================================================
  // Skenario H: Idempotency replay (request identik -> response identik)
  // =========================================================================
  it("Skenario H: Idempotency replay -> request identik menghasilkan respons identik tanpa duplikasi", async () => {
    const testDate = getFutureWeekday(16);
    const idempotencyKey = `idem-replay-${Date.now()}`;

    const payload = {
      serviceId: activeServiceId,
      date: testDate,
      time: "14:30",
      customer: { name: "Client H Idempotent", phone: "081299990801" },
      pet: { name: "PetH", type: "Kucing" },
    };

    const req1 = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    const res1 = await postGuestBooking(req1);
    expect(res1.status).toBe(201);
    const json1 = await res1.json();
    createdBookingCodes.push(json1.bookingCode);

    // Kirim request ulang identik dengan Idempotency-Key yang sama
    const req2 = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    const res2 = await postGuestBooking(req2);
    expect(res2.status).toBe(201);
    const json2 = await res2.json();

    // Verifikasi respons identik dan kode booking sama
    expect(json2.bookingCode).toBe(json1.bookingCode);

    // Verifikasi hanya 1 baris booking tercipta di database
    const bookingCount = await prisma.booking.count({
      where: { bookingCode: json1.bookingCode },
    });
    expect(bookingCount).toBe(1);
  });

  // =========================================================================
  // Skenario I: Idempotency conflict (key sama, payload beda -> 400)
  // =========================================================================
  it("Skenario I: Idempotency conflict -> key sama dengan payload beda ditolak (400)", async () => {
    const testDate = getFutureWeekday(17);
    const idempotencyKey = `idem-conflict-${Date.now()}`;

    const slotStart = jakartaDateToUtc(testDate, "15:00");
    const slotEnd = new Date(slotStart.getTime() + 120 * 60 * 1000);
    await prisma.booking.deleteMany({
      where: {
        resourceId: activeResourceId,
        startAt: { lt: slotEnd },
        occupancyEndAt: { gt: slotStart },
      },
    });

    const payloadOrig = {
      serviceId: activeServiceId,
      date: testDate,
      time: "15:00",
      customer: { name: "Client I Original", phone: "081299990901" },
      pet: { name: "PetI", type: "Kucing" },
    };

    const reqOrig = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payloadOrig),
    });

    const resOrig = await postGuestBooking(reqOrig);
    expect(resOrig.status).toBe(201);
    const jsonOrig = await resOrig.json();
    createdBookingCodes.push(jsonOrig.bookingCode);

    // Request dengan key sama tapi payload berbeda (nama beda)
    const payloadDifferent = {
      ...payloadOrig,
      customer: { name: "Attacker or Changed Client", phone: "081299990999" },
    };

    const reqConflict = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payloadDifferent),
    });

    const resConflict = await postGuestBooking(reqConflict);
    expect([400, 422]).toContain(resConflict.status);
    const jsonConflict = await resConflict.json();
    expect(jsonConflict.error.code).toMatch(/IDEMPOTENCY/);
  });

  // =========================================================================
  // Skenario J: Rollback dan integritas relasi tanpa rekaman yatim (zero orphan)
  // =========================================================================
  it("Skenario J: Rollback dan integritas relasi -> zero orphan records saat pembatalan/kegagalan", async () => {
    const testDate = getFutureWeekday(18);

    const bReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: testDate,
        time: "10:00",
        customer: { name: "Client J Orphan Check", phone: "081299991001" },
        pet: { name: "PetJ", type: "Anjing" },
      }),
    });

    const bRes = await postGuestBooking(bReq);
    expect(bRes.status).toBe(201);
    const bJson = await bRes.json();
    const bookingId = bJson.booking.id;

    // Verifikasi relasi anak terbentuk lengkap (token, history, customer, pet)
    const tokenCount = await prisma.bookingAccessToken.count({ where: { bookingId } });
    expect(tokenCount).toBeGreaterThanOrEqual(1);

    // Hapus booking untuk memverifikasi cascade integrity
    await prisma.booking.delete({ where: { id: bookingId } });

    // Verifikasi token akses anak terhapus (zero orphan)
    const tokensRemaining = await prisma.bookingAccessToken.count({ where: { bookingId } });
    expect(tokensRemaining).toBe(0);

    // Verifikasi status history terhapus (zero orphan)
    const historiesRemaining = await prisma.bookingStatusHistory.count({ where: { bookingId } });
    expect(historiesRemaining).toBe(0);

    // Verifikasi reschedule history terhapus (zero orphan)
    const rescheduleRemaining = await prisma.bookingRescheduleHistory.count({ where: { bookingId } });
    expect(rescheduleRemaining).toBe(0);
  });
});
