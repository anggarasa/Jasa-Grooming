import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Role, BookingStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { AuthError } from "@/modules/auth/session.service";

import { GET as getOverview } from "@/app/api/admin/dashboard/overview/route";
import { GET as listBookings, POST as postBooking } from "@/app/api/admin/bookings/route";
import { GET as getBookingDetail, PATCH as patchBookingNotes } from "@/app/api/admin/bookings/[id]/route";
import { PATCH as patchBookingStatus } from "@/app/api/admin/bookings/[id]/status/route";
import { POST as postReschedule } from "@/app/api/admin/bookings/[id]/reschedule/route";
import { POST as postCancel } from "@/app/api/admin/bookings/[id]/cancel/route";
import { GET as getCalendarEvents } from "@/app/api/admin/calendar/events/route";
import { GET as getAvailability } from "@/app/api/admin/availability/route";
import { GET as listCustomersRoute } from "@/app/api/admin/customers/route";
import { GET as getCustomerDetailRoute } from "@/app/api/admin/customers/[id]/route";
import {
  GET as listResourceBlocksRoute,
  POST as createResourceBlockRoute,
} from "@/app/api/admin/resource-blocks/route";
import { DELETE as deleteResourceBlockRoute } from "@/app/api/admin/resource-blocks/[id]/route";

const mockAdminUser = {
  id: "admin-test-id",
  name: "Admin PawCare",
  email: "admin@pawcare.test",
  role: Role.ADMIN,
  tokenVersion: 0,
  isActive: true,
  lastLoginAt: new Date(),
  passwordChangedAt: null,
};

let currentUserRole: Role | null = Role.ADMIN;

vi.mock("@/lib/auth/server", () => ({
  getCurrentUser: vi.fn(async () => {
    if (!currentUserRole) return null;
    return { ...mockAdminUser, role: currentUserRole };
  }),
  requireAuth: vi.fn(async () => {
    if (!currentUserRole) {
      throw new AuthError("Otentikasi diperlukan. Silakan masuk terlebih dahulu.", 401);
    }
    return { ...mockAdminUser, role: currentUserRole };
  }),
  requireRole: vi.fn(async (allowedRoles: Role[]) => {
    if (!currentUserRole) {
      throw new AuthError("Otentikasi diperlukan. Silakan masuk terlebih dahulu.", 401);
    }
    if (!allowedRoles.includes(currentUserRole)) {
      throw new AuthError("Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.", 403);
    }
    return { ...mockAdminUser, role: currentUserRole };
  }),
  assertOwner: vi.fn(async () => {
    if (!currentUserRole) {
      throw new AuthError("Otentikasi diperlukan. Silakan masuk terlebih dahulu.", 401);
    }
    if (currentUserRole !== Role.OWNER) {
      throw new AuthError("Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.", 403);
    }
    return { ...mockAdminUser, role: currentUserRole };
  }),
}));

function getFutureWeekday(daysAhead: number): string {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  if (futureDate.getDay() === 0) {
    futureDate.setDate(futureDate.getDate() + 1);
  }
  return futureDate.toISOString().slice(0, 10);
}

describe("Admin Booking Management API & Services (Integration)", () => {
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

  beforeEach(() => {
    currentUserRole = Role.ADMIN;
  });

  it("RBAC Guard: menolak akses tanpa otentikasi (401)", async () => {
    currentUserRole = null;
    const res = await getOverview();
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it("GET /api/admin/dashboard/overview — mengembalikan KPI harian dan daftar booking hari ini", async () => {
    const res = await getOverview();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.metrics).toBeDefined();
    expect(typeof json.data.metrics.todayTotal).toBe("number");
    expect(Array.isArray(json.data.todayBookings)).toBe(true);
  });

  it("POST /api/admin/bookings — membuat walk-in booking dan mencatat audit log", async () => {
    const targetDate = getFutureWeekday(12);
    const payload = {
      serviceId: activeServiceId,
      date: targetDate,
      time: "09:00",
      customer: {
        name: "Walk-in Budi",
        phone: "081233334444",
        email: "budi@walkin.test",
      },
      pet: {
        name: "Oyen",
        type: "Kucing",
        breed: "Domestik",
        age: 2,
      },
      internalNotes: "Walk-in tamu langsung front desk",
      autoConfirm: true,
      source: "WALK_IN",
    };

    const req = new NextRequest("http://localhost:3000/api/admin/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify(payload),
    });

    const res = await postBooking(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.booking.bookingCode).toMatch(/^GRM-/);
    expect(json.data.booking.status).toBe(BookingStatus.CONFIRMED);
    expect(json.data.booking.source).toBe("WALK_IN");

    createdBookingCodes.push(json.data.booking.bookingCode);

    // Cek di DB bahwa audit log tercatat
    const audit = await prisma.bookingAuditLog.findFirst({
      where: { bookingId: json.data.booking.id, action: "CREATE_WALK_IN_BOOKING" },
    });
    expect(audit).toBeDefined();
    expect(audit?.actorUserId).toBe(mockAdminUser.id);
  });

  it("GET /api/admin/bookings — pagination & search multi-field", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/admin/bookings?page=1&limit=5&search=Walk-in"
    );
    const res = await listBookings(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.items)).toBe(true);
    expect(json.data.meta.page).toBe(1);
    expect(json.data.meta.limit).toBe(5);
  });

  it("State Machine: PATCH /api/admin/bookings/[id]/status transisi CONFIRMED -> CHECKED_IN -> IN_PROGRESS -> COMPLETED", async () => {
    const bookingCode = createdBookingCodes[createdBookingCodes.length - 1];
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { bookingCode },
    });

    const routeParam = { params: Promise.resolve({ id: booking.id }) };

    // 1. CONFIRMED -> CHECKED_IN
    const req1 = new NextRequest(`http://localhost:3000/api/admin/bookings/${booking.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ status: BookingStatus.CHECKED_IN }),
    });
    const res1 = await patchBookingStatus(req1, routeParam);
    expect(res1.status).toBe(200);
    const json1 = await res1.json();
    expect(json1.data.status).toBe(BookingStatus.CHECKED_IN);

    // 2. CHECKED_IN -> IN_PROGRESS
    const req2 = new NextRequest(`http://localhost:3000/api/admin/bookings/${booking.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ status: BookingStatus.IN_PROGRESS }),
    });
    const res2 = await patchBookingStatus(req2, routeParam);
    expect(res2.status).toBe(200);

    // 3. IN_PROGRESS -> COMPLETED
    const req3 = new NextRequest(`http://localhost:3000/api/admin/bookings/${booking.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ status: BookingStatus.COMPLETED }),
    });
    const res3 = await patchBookingStatus(req3, routeParam);
    expect(res3.status).toBe(200);

    // 4. COMPLETED -> CONFIRMED (Harus ditolak: terminal state)
    const req4 = new NextRequest(`http://localhost:3000/api/admin/bookings/${booking.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ status: BookingStatus.CONFIRMED }),
    });
    const res4 = await patchBookingStatus(req4, routeParam);
    expect(res4.status).toBe(400);
  });

  it("POST /api/admin/bookings/[id]/reschedule — memindahkan jadwal dan mencatat reschedule history", async () => {
    // Buat booking baru untuk di-reschedule
    const testDate = getFutureWeekday(13);
    const resDateNew = getFutureWeekday(14);

    const createPayload = {
      serviceId: activeServiceId,
      date: testDate,
      time: "09:00",
      customer: {
        name: "Reschedule User",
        phone: "081288887777",
      },
      pet: {
        name: "Rocky",
        type: "Anjing",
      },
      autoConfirm: true,
      source: "ADMIN",
    };

    const createReq = new NextRequest("http://localhost:3000/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify(createPayload),
    });
    const createRes = await postBooking(createReq);
    expect(createRes.status).toBe(201);
    const createJson = await createRes.json();
    const targetBookingId = createJson.data.booking.id;
    createdBookingCodes.push(createJson.data.booking.bookingCode);

    // Lakukan reschedule ke tanggal baru
    const routeParam = { params: Promise.resolve({ id: targetBookingId }) };
    const reschedReq = new NextRequest(
      `http://localhost:3000/api/admin/bookings/${targetBookingId}/reschedule`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
        body: JSON.stringify({
          date: resDateNew,
          time: "10:00",
          reason: "Permintaan customer via WhatsApp",
        }),
      }
    );

    const reschedRes = await postReschedule(reschedReq, routeParam);
    expect(reschedRes.status).toBe(200);

    const reschedJson = await reschedRes.json();
    expect(reschedJson.success).toBe(true);

    // Verifikasi riwayat reschedule di DB
    const histories = await prisma.bookingRescheduleHistory.findMany({
      where: { bookingId: targetBookingId },
    });
    expect(histories.length).toBe(1);
    expect(histories[0].reason).toBe("Permintaan customer via WhatsApp");
  });

  it("POST /api/admin/resource-blocks & DELETE — time blocking manual dan pelepasan", async () => {
    const blockDate = getFutureWeekday(15);
    const startAt = new Date(`${blockDate}T09:00:00Z`).toISOString();
    const endAt = new Date(`${blockDate}T11:00:00Z`).toISOString();

    const createReq = new NextRequest("http://localhost:3000/api/admin/resource-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({
        resourceId: activeResourceId,
        startAt,
        endAt,
        reason: "Sterilisasi dan sanitasi stasiun",
      }),
    });

    const createRes = await createResourceBlockRoute(createReq);
    expect(createRes.status).toBe(201);
    const createJson = await createRes.json();
    const blockId = createJson.data.id;
    createdBlockIds.push(blockId);

    // List blocks
    const listReq = new NextRequest("http://localhost:3000/api/admin/resource-blocks");
    const listRes = await listResourceBlocksRoute(listReq);
    expect(listRes.status).toBe(200);

    // Hapus/batalkan block
    const delRouteParam = { params: Promise.resolve({ id: blockId }) };
    const delReq = new NextRequest(`http://localhost:3000/api/admin/resource-blocks/${blockId}`, {
      method: "DELETE",
      headers: { Origin: "http://localhost:3000" },
    });
    const delRes = await deleteResourceBlockRoute(delReq, delRouteParam);
    expect(delRes.status).toBe(200);

    const cancelledBlock = await prisma.resourceBlock.findUnique({
      where: { id: blockId },
    });
    expect(cancelledBlock?.cancelledAt).not.toBeNull();
  });

  it("GET /api/admin/calendar/events & GET /api/admin/customers — verifikasi query", async () => {
    const startStr = getFutureWeekday(1);
    const endStr = getFutureWeekday(7);

    const calReq = new NextRequest(
      `http://localhost:3000/api/admin/calendar/events?start=${startStr}&end=${endStr}`
    );
    const calRes = await getCalendarEvents(calReq);
    expect(calRes.status).toBe(200);
    const calJson = await calRes.json();
    expect(Array.isArray(calJson.data.bookings)).toBe(true);
    expect(Array.isArray(calJson.data.blockedTimes)).toBe(true);

    const custReq = new NextRequest("http://localhost:3000/api/admin/customers?page=1&limit=5");
    const custRes = await listCustomersRoute(custReq);
    expect(custRes.status).toBe(200);
    const custJson = await custRes.json();
    expect(Array.isArray(custJson.data.items)).toBe(true);

    if (custJson.data.items.length > 0) {
      const firstCustId = custJson.data.items[0].id;
      const detailParam = { params: Promise.resolve({ id: firstCustId }) };
      const detailRes = await getCustomerDetailRoute(new NextRequest("http://localhost:3000/api/admin/customers/" + firstCustId), detailParam);
      expect(detailRes.status).toBe(200);
    }
  });

  it("GET & PATCH /api/admin/bookings/[id], POST /api/admin/bookings/[id]/cancel, dan GET /api/admin/availability", async () => {
    const bookingCode = createdBookingCodes[createdBookingCodes.length - 1];
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { bookingCode },
    });

    const routeParam = { params: Promise.resolve({ id: booking.id }) };

    // 1. GET detail
    const getReq = new NextRequest(`http://localhost:3000/api/admin/bookings/${booking.id}`);
    const getRes = await getBookingDetail(getReq, routeParam);
    expect(getRes.status).toBe(200);

    // 2. PATCH internal notes
    const patchReq = new NextRequest(`http://localhost:3000/api/admin/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ internalNotes: "Catatan khusus: Anabul butuh istirahat sejenak." }),
    });
    const patchRes = await patchBookingNotes(patchReq, routeParam);
    expect(patchRes.status).toBe(200);

    // 3. GET admin availability with excludeBookingId
    const availDate = getFutureWeekday(13);
    const availReq = new NextRequest(
      `http://localhost:3000/api/admin/availability?serviceId=${activeServiceId}&date=${availDate}&excludeBookingId=${booking.id}`
    );
    const availRes = await getAvailability(availReq);
    expect(availRes.status).toBe(200);

    // 4. POST cancel booking
    // Buat booking sementara untuk di-cancel
    const tempCancelDate = getFutureWeekday(25);
    const createReq = new NextRequest("http://localhost:3000/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({
        serviceId: activeServiceId,
        date: tempCancelDate,
        time: "09:00",
        customer: { name: "Cancel Target", phone: "081299995555" },
        pet: { name: "Mimi", type: "Kucing" },
      }),
    });
    const createRes = await postBooking(createReq);
    expect(createRes.status).toBe(201);
    const createJson = await createRes.json();
    const cancelTargetId = createJson.data.booking.id;
    createdBookingCodes.push(createJson.data.booking.bookingCode);

    const cancelParam = { params: Promise.resolve({ id: cancelTargetId }) };
    const cancelReq = new NextRequest(`http://localhost:3000/api/admin/bookings/${cancelTargetId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ reason: "Pelanggan berhalangan hadir darurat" }),
    });
    const cancelRes = await postCancel(cancelReq, cancelParam);
    expect(cancelRes.status).toBe(200);
    const cancelJson = await cancelRes.json();
    expect(cancelJson.data.status).toBe(BookingStatus.CANCELLED);
  });
});
