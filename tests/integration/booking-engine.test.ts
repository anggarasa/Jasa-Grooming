import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@backend/lib/prisma";
import { GET as getAvailability } from "@/app/api/availability/route";
import { POST as postBooking } from "@/app/api/bookings/route";
import { GET as getBookingManage } from "@/app/api/bookings/manage/route";
import { GET as getBookingManageAlias } from "@/app/api/booking/manage/route";

vi.mock("@backend/modules/integrations/google/google-freebusy.service", () => ({
  queryGoogleFreeBusy: vi.fn().mockResolvedValue({
    isAvailableChecked: false,
    isFailClosed: false,
    busyIntervals: [],
  }),
}));

function getFutureWeekday(daysAhead: number): string {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  if (futureDate.getDay() === 0) {
    futureDate.setDate(futureDate.getDate() + 1); // Geser jika hari Minggu
  }
  return futureDate.toISOString().slice(0, 10);
}

describe("Booking Engine Integration & PostgreSQL Concurrency Control", () => {
  let activeServiceId: string;
  const createdBookingCodes: string[] = [];

  beforeAll(async () => {
    // 1. Ambil layanan aktif yang sudah di-seed
    const service = await prisma.service.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    if (!service) {
      throw new Error("Layanan aktif tidak ditemukan di basis data.");
    }
    activeServiceId = service.id;

    // Bersihkan sisa data reservasi pengujian konkurensi sebelumnya
    await prisma.booking.deleteMany({
      where: {
        customer: {
          phone: { in: ["081211110001", "081211110002", "081299998888", "081234567890"] },
        },
      },
    });
  });

  afterAll(async () => {
    // Bersihkan data reservasi dan idempotency pengujian
    if (createdBookingCodes.length > 0) {
      await prisma.booking.deleteMany({
        where: { bookingCode: { in: createdBookingCodes } },
      });
    }
  });

  it("GET /api/availability — mengembalikan slot jam yang tersedia untuk tanggal operasional", async () => {
    const testDate = getFutureWeekday(5);
    const req = new NextRequest(
      `http://localhost:3000/api/availability?serviceId=${activeServiceId}&date=${testDate}`
    );
    const res = await getAvailability(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.date).toBe(testDate);
    expect(Array.isArray(json.slots)).toBe(true);
    expect(json.slots.length).toBeGreaterThan(0);

    const slot0900 = json.slots.find((s: { time: string }) => s.time === "09:00");
    expect(slot0900).toBeDefined();
    expect(slot0900.available).toBe(true);
  });

  it("GET /api/availability — mengembalikan HTTP 400 jika parameter query tidak lengkap", async () => {
    const req = new NextRequest("http://localhost:3000/api/availability?date=2026-10-24");
    const res = await getAvailability(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("POST /api/bookings — membuat reservasi baru dengan snapshot harga, durasi, dan guest token", async () => {
    const testDate = getFutureWeekday(6);
    const bookingPayload = {
      serviceId: activeServiceId,
      date: testDate,
      time: "09:00",
      customer: {
        name: "Rina Nose",
        phone: "081299998888",
        email: "rina@example.com",
      },
      pet: {
        name: "Chiko",
        type: "Kucing",
        breed: "British Shorthair",
        age: 3,
        notes: "Suka dimandikan air hangat",
      },
      customerNotes: "Mohon hati-hati di area telinga",
    };

    const req = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingPayload),
    });

    const res = await postBooking(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.bookingCode).toMatch(/^GRM-/);
    expect(json.manageToken).toBeDefined();
    expect(json.manageToken.length).toBe(64);
    expect(json.booking.serviceName).toBeDefined();
    expect(json.booking.totalPrice).toBeGreaterThan(0);
    expect(json.booking.customer.name).toBe("Rina Nose");
    expect(json.booking.pet.name).toBe("Chiko");

    createdBookingCodes.push(json.bookingCode);

    // Verifikasi snapshot dan token hash di basis data
    const savedBooking = await prisma.booking.findUnique({
      where: { bookingCode: json.bookingCode },
      include: { accessTokens: true, statusHistories: true },
    });
    expect(savedBooking).toBeDefined();
    expect(savedBooking?.serviceNameSnapshot).toBe(json.booking.serviceName);
    expect(savedBooking?.accessTokens.length).toBeGreaterThan(0);
    expect(savedBooking?.statusHistories.length).toBeGreaterThan(0);
  });

  it("GET /api/bookings/manage & GET /api/booking/manage — memverifikasi guest token dan mengembalikan DTO", async () => {
    const testDate = getFutureWeekday(7);
    const bookingPayload = {
      serviceId: activeServiceId,
      date: testDate,
      time: "09:00",
      customer: {
        name: "Andi Wijaya",
        phone: "081277776666",
      },
      pet: {
        name: "Milo",
        type: "Anjing",
        breed: "Pomeranian",
      },
    };

    const createReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingPayload),
    });

    const createRes = await postBooking(createReq);
    expect(createRes.status).toBe(201);
    const createdJson = await createRes.json();
    createdBookingCodes.push(createdJson.bookingCode);

    const token = createdJson.manageToken;

    // 2. Akses GET /api/bookings/manage?token=...
    const reqPlural = new NextRequest(`http://localhost:3000/api/bookings/manage?token=${token}`);
    const resPlural = await getBookingManage(reqPlural);
    expect(resPlural.status).toBe(200);

    const jsonPlural = await resPlural.json();
    expect(jsonPlural.success).toBe(true);
    expect(jsonPlural.booking.bookingCode).toBe(createdJson.bookingCode);
    expect(jsonPlural.booking.customer.name).toBe("Andi Wijaya");
    expect(jsonPlural.booking.canCancel).toBe(true);

    // 3. Akses via alias GET /api/booking/manage?token=...
    const reqSingular = new NextRequest(`http://localhost:3000/api/booking/manage?token=${token}`);
    const resSingular = await getBookingManageAlias(reqSingular);
    expect(resSingular.status).toBe(200);

    // 4. Token acak tidak valid mengembalikan 404
    const reqInvalid = new NextRequest("http://localhost:3000/api/bookings/manage?token=token_palsu_123");
    const resInvalid = await getBookingManage(reqInvalid);
    expect(resInvalid.status).toBe(404);
  });

  it("Idempotency — mencegah double submit dengan Idempotency-Key yang sama", async () => {
    const testDate = getFutureWeekday(8);
    const idemKey = `test-idem-${Date.now()}`;
    const bookingPayload = {
      serviceId: activeServiceId,
      date: testDate,
      time: "09:00",
      customer: {
        name: "Idem User",
        phone: "081255554444",
      },
      pet: {
        name: "Kuro",
        type: "Kucing",
      },
    };

    // Request pertama
    const req1 = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idemKey,
      },
      body: JSON.stringify(bookingPayload),
    });
    const res1 = await postBooking(req1);
    expect(res1.status).toBe(201);
    const json1 = await res1.json();
    createdBookingCodes.push(json1.bookingCode);

    // Request kedua (identik, Idempotency-Key sama persis)
    const req2 = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idemKey,
      },
      body: JSON.stringify(bookingPayload),
    });
    const res2 = await postBooking(req2);
    expect(res2.status).toBe(201);
    const json2 = await res2.json();

    // Harus mengembalikan kode booking yang sama persis
    expect(json2.bookingCode).toBe(json1.bookingCode);

    // Request ketiga (Idempotency-Key sama, tapi payload berbeda -> harus 422)
    const modifiedPayload = {
      ...bookingPayload,
      customer: { ...bookingPayload.customer, name: "Nama Berbeda" },
    };
    const req3 = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idemKey,
      },
      body: JSON.stringify(modifiedPayload),
    });
    const res3 = await postBooking(req3);
    expect(res3.status).toBe(422);
  });

  it("PostgreSQL Concurrency Control — 2 request simultan pada slot sama: tepat 1 sukses (201) dan 1 ditolak (409)", async () => {
    const testDate = getFutureWeekday(9);
    const targetTime = "09:00";

    // Pastikan slot bersih dari sisa pengujian sebelumnya sebelum uji perlombaan
    await prisma.booking.deleteMany({
      where: {
        startAt: new Date(`${testDate}T02:00:00.000Z`),
      },
    });

    const payloadA = {
      serviceId: activeServiceId,
      date: testDate,
      time: targetTime,
      customer: {
        name: "Pelanggan Alpha",
        phone: "081211110001",
      },
      pet: {
        name: "Doggy Alpha",
        type: "Anjing",
      },
    };

    const payloadB = {
      serviceId: activeServiceId,
      date: testDate,
      time: targetTime,
      customer: {
        name: "Pelanggan Beta",
        phone: "081211110002",
      },
      pet: {
        name: "Kitty Beta",
        type: "Kucing",
      },
    };

    const reqA = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadA),
    });

    const reqB = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadB),
    });

    // Jalankan kedua permintaan SECARA BERSAMAAN (Race Condition)
    const [resA, resB] = await Promise.all([postBooking(reqA), postBooking(reqB)]);

    const statuses = [resA.status, resB.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    // Ambil detail respon
    const successRes = resA.status === 201 ? resA : resB;
    const conflictRes = resA.status === 409 ? resA : resB;

    const successJson = await successRes.json();
    const conflictJson = await conflictRes.json();

    expect(successJson.success).toBe(true);
    expect(successJson.bookingCode).toMatch(/^GRM-/);
    createdBookingCodes.push(successJson.bookingCode);

    expect(conflictJson.success).toBe(false);
    expect(conflictJson.error.code).toBe("SLOT_UNAVAILABLE");

    // Pastikan di basis data HANYA ADA TEPAT 1 reservasi pada slot tersebut
    const savedBookings = await prisma.booking.findMany({
      where: {
        bookingCode: { in: [successJson.bookingCode] },
      },
    });
    expect(savedBookings.length).toBe(1);
  });
});
