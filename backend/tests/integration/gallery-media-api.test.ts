import { describe, it, expect, vi, afterAll, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Readable } from "stream";
import { Role } from "@prisma/client";
import { prisma } from "@backend/lib/prisma";
import { minioClient } from "@backend/lib/minio";
import { POST as uploadMediaRoute } from "@backend/api/media/upload/route";
import {
  GET as getMediaRoute,
  DELETE as deleteMediaRoute,
} from "@backend/api/media/[...key]/route";
import { GET as getGallery, POST as postGallery } from "@backend/api/gallery/route";
import {
  PATCH as patchGallery,
  DELETE as deleteGalleryRoute,
} from "@backend/api/gallery/[id]/route";
import { AuthError } from "@backend/modules/auth/session.service";

let currentUserRole: Role | null = Role.ADMIN;

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

describe("Gallery & MinIO Media API Routes (Integration)", () => {
  let createdGalleryId = "";
  let uploadedObjectKey = "";
  let uploadedMediaAssetId = "";

  beforeEach(() => {
    currentUserRole = Role.ADMIN;
    vi.spyOn(minioClient, "bucketExists").mockResolvedValue(true);
    vi.spyOn(minioClient, "putObject").mockResolvedValue({
      etag: "mock-etag-123",
      versionId: "1",
    });
    vi.spyOn(minioClient, "removeObject").mockResolvedValue(undefined);
  });

  afterAll(async () => {
    if (createdGalleryId) {
      await prisma.businessGallery.deleteMany({ where: { id: createdGalleryId } });
    }
    if (uploadedMediaAssetId) {
      await prisma.mediaAsset.deleteMany({ where: { id: uploadedMediaAssetId } });
    }
  });

  describe("Media Upload & Proxy Retrieval", () => {
    it("POST /api/media/upload berhasil mengunggah gambar PNG valid", async () => {
      // 12-byte valid PNG header
      const pngBytes = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);
      const file = new File([pngBytes], "cute-cat.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "services/images");

      const req = new NextRequest("http://localhost:3000/api/media/upload", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
        },
        body: formData,
      });

      const res = await uploadMediaRoute(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.objectKey).toContain("services/images/");
      expect(json.data.mimeType).toBe("image/png");

      uploadedObjectKey = json.data.objectKey;
      uploadedMediaAssetId = json.data.id;
    });

    it("POST /api/media/upload menolak file berbahaya (SVG) dengan HTTP 400", async () => {
      const svgText = "<svg><circle r='10'/></svg>";
      const file = new File([svgText], "danger.svg", { type: "image/svg+xml" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "services/images");

      const req = new NextRequest("http://localhost:3000/api/media/upload", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
        },
        body: formData,
      });

      const res = await uploadMediaRoute(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("BAD_REQUEST");
    });

    it("GET /api/media/[...key] melayani proxy streaming dengan Content-Type yang tepat", async () => {
      const mockStream = Readable.from(Buffer.from("mock-binary-image-data"));
      vi.spyOn(minioClient, "statObject").mockResolvedValue({
        size: 22,
        metaData: { "content-type": "image/png" },
      } as unknown as import("minio").BucketItemStat);
      vi.spyOn(minioClient, "getObject").mockResolvedValue(mockStream as unknown as Readable);

      const keySegments = uploadedObjectKey.split("/");
      const req = new NextRequest(`http://localhost:3000/api/media/${uploadedObjectKey}`);
      const res = await getMediaRoute(req, {
        params: Promise.resolve({ key: keySegments }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("image/png");
      expect(res.headers.get("Cache-Control")).toContain("public");
    });

    it("DELETE /api/media/[...key] berhasil menghapus media dari MinIO dan database", async () => {
      const keySegments = uploadedObjectKey.split("/");
      const req = new NextRequest(`http://localhost:3000/api/media/${uploadedObjectKey}`, {
        method: "DELETE",
        headers: {
          origin: "http://localhost:3000",
        },
      });

      const res = await deleteMediaRoute(req, {
        params: Promise.resolve({ key: keySegments }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(minioClient.removeObject).toHaveBeenCalled();
    });

    it("GET /api/media/[...key] menolak path traversal dengan HTTP 404", async () => {
      const req = new NextRequest("http://localhost:3000/api/media/../../etc/passwd");
      const res = await getMediaRoute(req, {
        params: Promise.resolve({ key: ["..", "..", "etc", "passwd"] }),
      });
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("NOT_FOUND");
    });
  });

  describe("Business Gallery CRUD", () => {
    it("POST /api/gallery menambahkan item galeri baru", async () => {
      const req = new NextRequest("http://localhost:3000/api/gallery", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          objectKey: "gallery/images/sample-grooming.webp",
          caption: "Hasil grooming kucing anggora fluffy.",
          altText: "Kucing putih bersih setelah mandi.",
          displayOrder: 1,
        }),
      });

      const res = await postGallery(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.caption).toBe("Hasil grooming kucing anggora fluffy.");
      createdGalleryId = json.data.id;
    });

    it("GET /api/gallery mengambil daftar item galeri", async () => {
      const req = new NextRequest("http://localhost:3000/api/gallery");
      const res = await getGallery(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.some((g: { id: string }) => g.id === createdGalleryId)).toBe(true);
    });

    it("PATCH /api/gallery/[id] memperbarui keterangan item galeri", async () => {
      const req = new NextRequest(`http://localhost:3000/api/gallery/${createdGalleryId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          caption: "Hasil grooming kucing anggora super fluffy & wangi.",
          displayOrder: 2,
        }),
      });

      const res = await patchGallery(req, {
        params: Promise.resolve({ id: createdGalleryId }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.caption).toBe("Hasil grooming kucing anggora super fluffy & wangi.");
      expect(json.data.displayOrder).toBe(2);
    });

    it("DELETE /api/gallery/[id] menghapus item galeri dan memicu penghapusan objek MinIO", async () => {
      const req = new NextRequest(`http://localhost:3000/api/gallery/${createdGalleryId}`, {
        method: "DELETE",
        headers: {
          origin: "http://localhost:3000",
        },
      });

      const res = await deleteGalleryRoute(req, {
        params: Promise.resolve({ id: createdGalleryId }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);

      const itemInDb = await prisma.businessGallery.findUnique({
        where: { id: createdGalleryId },
      });
      expect(itemInDb).toBeNull();
      expect(minioClient.removeObject).toHaveBeenCalledWith(
        expect.any(String),
        "gallery/images/sample-grooming.webp"
      );
      createdGalleryId = "";
    });
  });
});
