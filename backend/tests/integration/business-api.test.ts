import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { GET as getBusiness, PATCH as patchBusiness } from "@backend/api/business/route";
import { GET as getHours, PUT as putHours } from "@backend/api/business/hours/route";
import { GET as getBookingSettings, PATCH as patchBookingSettings } from "@backend/api/business/booking-settings/route";
import { AuthError } from "@backend/modules/auth/session.service";

// Mock server auth helpers
const mockUser = {
  id: "test-owner-id",
  name: "Owner PawCare",
  email: "owner@pawcare.test",
  role: Role.OWNER,
  tokenVersion: 0,
  isActive: true,
  lastLoginAt: new Date(),
  passwordChangedAt: null,
};

let currentUserRole: Role | null = Role.OWNER;

vi.mock("@backend/lib/auth/server", () => ({
  getCurrentUser: vi.fn(async () => {
    if (!currentUserRole) return null;
    return { ...mockUser, role: currentUserRole };
  }),
  requireAuth: vi.fn(async () => {
    if (!currentUserRole) {
      throw new AuthError("Otentikasi diperlukan. Silakan masuk terlebih dahulu.", 401);
    }
    return { ...mockUser, role: currentUserRole };
  }),
  requireRole: vi.fn(async (allowedRoles: Role[]) => {
    if (!currentUserRole) {
      throw new AuthError("Otentikasi diperlukan. Silakan masuk terlebih dahulu.", 401);
    }
    if (!allowedRoles.includes(currentUserRole)) {
      throw new AuthError("Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.", 403);
    }
    return { ...mockUser, role: currentUserRole };
  }),
  assertOwner: vi.fn(async () => {
    if (!currentUserRole) {
      throw new AuthError("Otentikasi diperlukan. Silakan masuk terlebih dahulu.", 401);
    }
    if (currentUserRole !== Role.OWNER) {
      throw new AuthError("Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.", 403);
    }
    return { ...mockUser, role: currentUserRole };
  }),
}));

describe("Business Settings & Operating Hours API Routes (Integration)", () => {
  beforeEach(() => {
    currentUserRole = Role.OWNER;
  });

  describe("GET & PATCH /api/business", () => {
    it("GET /api/business mengembalikan profil bisnis PawCare Grooming", async () => {
      const res = await getBusiness();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.slug).toBe("pawcare-grooming");
      expect(json.data.name).toBeDefined();
    });

    it("PATCH /api/business berhasil memperbarui profil bisnis oleh OWNER", async () => {
      const req = new NextRequest("http://localhost:3000/api/business", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          name: "PawCare Luxury Grooming",
          phone: "081987654321",
          city: "Jakarta Utara",
        }),
      });

      const res = await patchBusiness(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.name).toBe("PawCare Luxury Grooming");
      expect(json.data.phone).toBe("081987654321");
    });

    it("PATCH /api/business menolak jika role adalah ADMIN dengan HTTP 403", async () => {
      currentUserRole = Role.ADMIN;

      const req = new NextRequest("http://localhost:3000/api/business", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          name: "Hacked PawCare",
        }),
      });

      const res = await patchBusiness(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("FORBIDDEN");
    });
  });

  describe("GET & PUT /api/business/hours", () => {
    it("GET /api/business/hours mengembalikan jadwal 7 hari operasional", async () => {
      const res = await getHours();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBe(7);
      expect(json.data[0].dayOfWeek).toBe(0);
    });

    it("PUT /api/business/hours memperbarui jam operasional dan jam istirahat", async () => {
      const newHours = [
        {
          dayOfWeek: 0,
          isOpen: false,
          openTime: "10:00",
          closeTime: "16:00",
          breaks: [],
        },
        {
          dayOfWeek: 1,
          isOpen: true,
          openTime: "08:30",
          closeTime: "17:30",
          breaks: [
            { startTime: "12:00", endTime: "13:00" },
          ],
        },
      ];

      const req = new NextRequest("http://localhost:3000/api/business/hours", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ hours: newHours }),
      });

      const res = await putHours(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(2);
      expect(json.data[1].openTime).toBe("08:30");
      expect(json.data[1].breaks.length).toBe(1);
    });

    it("PUT /api/business/hours menolak jika jam istirahat bentrok (overlap)", async () => {
      const invalidHours = [
        {
          dayOfWeek: 1,
          isOpen: true,
          openTime: "09:00",
          closeTime: "18:00",
          breaks: [
            { startTime: "12:00", endTime: "13:00" },
            { startTime: "12:30", endTime: "13:30" },
          ],
        },
      ];

      const req = new NextRequest("http://localhost:3000/api/business/hours", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ hours: invalidHours }),
      });

      const res = await putHours(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET & PATCH /api/business/booking-settings", () => {
    it("GET /api/business/booking-settings mengembalikan konfigurasi booking", async () => {
      currentUserRole = Role.ADMIN;
      const res = await getBookingSettings();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.bookingIntervalMinutes).toBeDefined();
      expect(json.data.minimumAdvanceMinutes).toBeDefined();
    });

    it("PATCH /api/business/booking-settings berhasil diperbarui oleh OWNER", async () => {
      currentUserRole = Role.OWNER;
      const req = new NextRequest("http://localhost:3000/api/business/booking-settings", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          bookingIntervalMinutes: 45,
          defaultBufferMinutes: 20,
          autoConfirmBooking: true,
        }),
      });

      const res = await patchBookingSettings(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.bookingIntervalMinutes).toBe(45);
      expect(json.data.defaultBufferMinutes).toBe(20);
      expect(json.data.autoConfirmBooking).toBe(true);
    });

    it("PATCH /api/business/booking-settings menolak perubahan oleh ADMIN dengan HTTP 403", async () => {
      currentUserRole = Role.ADMIN;
      const req = new NextRequest("http://localhost:3000/api/business/booking-settings", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          autoConfirmBooking: false,
        }),
      });

      const res = await patchBookingSettings(req);
      expect(res.status).toBe(403);
    });
  });
});
