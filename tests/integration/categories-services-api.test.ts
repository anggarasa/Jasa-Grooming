import { describe, it, expect, vi, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@backend/lib/prisma";
import { GET as getCategories, POST as postCategory } from "@/app/api/service-categories/route";
import {
  GET as getCategory,
  PATCH as patchCategory,
  DELETE as deleteCategoryRoute,
} from "@/app/api/service-categories/[id]/route";
import { GET as getServices, POST as postService } from "@/app/api/services/route";
import {
  GET as getService,
  PATCH as patchService,
  DELETE as deleteServiceRoute,
} from "@/app/api/services/[id]/route";
import { AuthError } from "@backend/modules/auth/session.service";

const currentUserRole = Role.ADMIN as Role;

vi.mock("@backend/lib/auth/server", () => ({
  getCurrentUser: vi.fn(async () => {
    if (!currentUserRole) return null;
    return {
      id: "test-admin-id",
      name: "Admin PawCare",
      email: "admin@pawcare.test",
      role: currentUserRole,
      tokenVersion: 0,
      isActive: true,
      lastLoginAt: new Date(),
      passwordChangedAt: null,
    };
  }),
  requireAuth: vi.fn(async () => {
    if (!currentUserRole) {
      throw new AuthError("Otentikasi diperlukan. Silakan masuk terlebih dahulu.", 401);
    }
    return {
      id: "test-admin-id",
      name: "Admin PawCare",
      email: "admin@pawcare.test",
      role: currentUserRole,
      tokenVersion: 0,
      isActive: true,
      lastLoginAt: new Date(),
      passwordChangedAt: null,
    };
  }),
  requireRole: vi.fn(async (allowedRoles: Role[]) => {
    if (!currentUserRole) {
      throw new AuthError("Otentikasi diperlukan. Silakan masuk terlebih dahulu.", 401);
    }
    if (!allowedRoles.includes(currentUserRole)) {
      throw new AuthError("Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.", 403);
    }
    return {
      id: "test-admin-id",
      name: "Admin PawCare",
      email: "admin@pawcare.test",
      role: currentUserRole,
      tokenVersion: 0,
      isActive: true,
      lastLoginAt: new Date(),
      passwordChangedAt: null,
    };
  }),
  assertOwner: vi.fn(async () => {
    if (!currentUserRole) {
      throw new AuthError("Otentikasi diperlukan. Silakan masuk terlebih dahulu.", 401);
    }
    if (currentUserRole !== Role.OWNER) {
      throw new AuthError("Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.", 403);
    }
    return {
      id: "test-admin-id",
      name: "Owner PawCare",
      email: "owner@pawcare.test",
      role: currentUserRole,
      tokenVersion: 0,
      isActive: true,
      lastLoginAt: new Date(),
      passwordChangedAt: null,
    };
  }),
}));

describe("Service Categories & Grooming Services API Routes (Integration)", () => {
  let createdCategoryId = "";
  let createdServiceId = "";

  afterAll(async () => {
    // Cleanup data uji
    if (createdServiceId) {
      await prisma.service.deleteMany({ where: { id: createdServiceId } });
    }
    if (createdCategoryId) {
      await prisma.serviceCategory.deleteMany({ where: { id: createdCategoryId } });
    }
  });

  describe("Service Categories CRUD", () => {
    it("POST /api/service-categories membuat kategori baru", async () => {
      const req = new NextRequest("http://localhost:3000/api/service-categories", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          name: "Spa & Aromaterapi",
          slug: "spa-dan-aromaterapi",
          description: "Treatment relaksasi mewah untuk anabul.",
          displayOrder: 10,
        }),
      });

      const res = await postCategory(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.name).toBe("Spa & Aromaterapi");
      expect(json.data.slug).toBe("spa-dan-aromaterapi");
      createdCategoryId = json.data.id;
    });

    it("GET /api/service-categories mengambil daftar kategori", async () => {
      const req = new NextRequest("http://localhost:3000/api/service-categories");
      const res = await getCategories(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.some((c: { id: string }) => c.id === createdCategoryId)).toBe(true);
    });

    it("GET /api/service-categories/[id] mengambil detail kategori", async () => {
      const req = new NextRequest(`http://localhost:3000/api/service-categories/${createdCategoryId}`);
      const res = await getCategory(req, {
        params: Promise.resolve({ id: createdCategoryId }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(createdCategoryId);
    });

    it("PATCH /api/service-categories/[id] memperbarui data kategori", async () => {
      const req = new NextRequest(`http://localhost:3000/api/service-categories/${createdCategoryId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          description: "Treatment relaksasi aromaterapi premium.",
        }),
      });

      const res = await patchCategory(req, {
        params: Promise.resolve({ id: createdCategoryId }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.description).toBe("Treatment relaksasi aromaterapi premium.");
    });
  });

  describe("Grooming Services CRUD", () => {
    it("POST /api/services membuat layanan baru", async () => {
      const req = new NextRequest("http://localhost:3000/api/services", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          categoryId: createdCategoryId,
          name: "Mandi Bunga & Pijat Relaksasi",
          slug: "mandi-bunga-pijat",
          shortDescription: "Mandi air hangat dengan kelopak bunga dan pijatan lembut.",
          durationMinutes: 75,
          bufferMinutes: 15,
          price: 250000,
          displayOrder: 1,
        }),
      });

      const res = await postService(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.name).toBe("Mandi Bunga & Pijat Relaksasi");
      expect(Number(json.data.price)).toBe(250000);
      createdServiceId = json.data.id;
    });

    it("GET /api/services mengambil daftar layanan dengan filter categoryId", async () => {
      const req = new NextRequest(`http://localhost:3000/api/services?categoryId=${createdCategoryId}`);
      const res = await getServices(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
      expect(json.data[0].id).toBe(createdServiceId);
    });

    it("GET /api/services/[id] mengambil detail layanan grooming", async () => {
      const req = new NextRequest(`http://localhost:3000/api/services/${createdServiceId}`);
      const res = await getService(req, {
        params: Promise.resolve({ id: createdServiceId }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(createdServiceId);
      expect(json.data.name).toBe("Mandi Bunga & Pijat Relaksasi");
    });

    it("PATCH /api/services/[id] memperbarui harga dan durasi layanan", async () => {
      const req = new NextRequest(`http://localhost:3000/api/services/${createdServiceId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          price: 275000,
          durationMinutes: 90,
        }),
      });

      const res = await patchService(req, {
        params: Promise.resolve({ id: createdServiceId }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Number(json.data.price)).toBe(275000);
      expect(json.data.durationMinutes).toBe(90);
    });

    it("DELETE /api/service-categories/[id] melakukan safe deactivation jika memiliki layanan terkait", async () => {
      const req = new NextRequest(`http://localhost:3000/api/service-categories/${createdCategoryId}`, {
        method: "DELETE",
        headers: {
          origin: "http://localhost:3000",
        },
      });

      const res = await deleteCategoryRoute(req, {
        params: Promise.resolve({ id: createdCategoryId }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.deactivated).toBe(true);

      // Kategori masih ada di DB tapi isActive = false
      const catInDb = await prisma.serviceCategory.findUnique({
        where: { id: createdCategoryId },
      });
      expect(catInDb).not.toBeNull();
      expect(catInDb?.isActive).toBe(false);
    });

    it("DELETE /api/services/[id] menghapus permanen layanan tanpa riwayat booking", async () => {
      const req = new NextRequest(`http://localhost:3000/api/services/${createdServiceId}`, {
        method: "DELETE",
        headers: {
          origin: "http://localhost:3000",
        },
      });

      const res = await deleteServiceRoute(req, {
        params: Promise.resolve({ id: createdServiceId }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.deactivated).toBe(false);

      const serviceInDb = await prisma.service.findUnique({
        where: { id: createdServiceId },
      });
      expect(serviceInDb).toBeNull();
      createdServiceId = "";
    });

    it("DELETE /api/service-categories/[id] menghapus permanen kategori setelah layanannya bersih", async () => {
      const req = new NextRequest(`http://localhost:3000/api/service-categories/${createdCategoryId}`, {
        method: "DELETE",
        headers: {
          origin: "http://localhost:3000",
        },
      });

      const res = await deleteCategoryRoute(req, {
        params: Promise.resolve({ id: createdCategoryId }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.deactivated).toBe(false);

      const catInDb = await prisma.serviceCategory.findUnique({
        where: { id: createdCategoryId },
      });
      expect(catInDb).toBeNull();
      createdCategoryId = "";
    });
  });
});
