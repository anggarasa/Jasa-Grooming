import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPublicCategories,
  getPublicServices,
  getPublicServiceBySlug,
  getPublicServiceById,
} from "@backend/modules/public/public-services.service";
import { getPublicGallery } from "@backend/modules/public/public-gallery.service";
import { prisma } from "@backend/lib/prisma";

vi.mock("@backend/lib/prisma", () => ({
  prisma: {
    serviceCategory: {
      findMany: vi.fn(),
    },
    service: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    businessGallery: {
      findMany: vi.fn(),
    },
  },
}));

describe("Public Services & Gallery Services (Unit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPublicCategories", () => {
    it("mengambil kategori aktif beserta jumlah layanan aktif", async () => {
      vi.mocked(prisma.serviceCategory.findMany).mockResolvedValueOnce([
        {
          id: "cat-1",
          name: "Grooming Anjing",
          slug: "grooming-anjing",
          description: "Perawatan anjing",
          displayOrder: 1,
          _count: {
            services: 5,
          },
        },
      ] as unknown as Awaited<ReturnType<typeof prisma.serviceCategory.findMany>>);

      const categories = await getPublicCategories();

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe("Grooming Anjing");
      expect(categories[0].serviceCount).toBe(5);
      expect(prisma.serviceCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            business: { isActive: true },
          },
        })
      );
    });
  });

  describe("getPublicServices", () => {
    it("mengambil layanan aktif dan memformat Decimal ke number serta string IDR", async () => {
      vi.mocked(prisma.service.findMany).mockResolvedValueOnce([
        {
          id: "svc-1",
          name: "Basic Bath Anjing",
          slug: "basic-bath-anjing",
          description: "Mandi bersih",
          shortDescription: "Mandi sampo premium",
          fullDescription: "Mandi dengan sampo khusus jenis bulu anjing",
          durationMinutes: 45,
          bufferMinutes: 15,
          price: 85000,
          imageObjectKey: "uploads/bath.jpg",
          displayOrder: 1,
          category: {
            id: "cat-1",
            name: "Grooming Anjing",
            slug: "grooming-anjing",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as unknown as Awaited<ReturnType<typeof prisma.service.findMany>>);

      const services = await getPublicServices();

      expect(services).toHaveLength(1);
      expect(services[0].name).toBe("Basic Bath Anjing");
      expect(services[0].price).toBe(85000);
      expect(services[0].formattedPrice).toContain("85.000");
    });

    it("menerapkan filter categorySlug dan pencarian teks secara tepat", async () => {
      vi.mocked(prisma.service.findMany).mockResolvedValueOnce([]);

      await getPublicServices({
        categorySlug: "grooming-kucing",
        search: "spa",
      });

      expect(prisma.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            category: expect.objectContaining({
              slug: "grooming-kucing",
            }),
            OR: expect.arrayContaining([
              { name: { contains: "spa", mode: "insensitive" } },
            ]),
          }),
        })
      );
    });
  });

  describe("getPublicServiceBySlug", () => {
    it("mengembalikan detail layanan dan daftar related services aktif dalam kategori", async () => {
      const mockMainService = {
        id: "svc-1",
        name: "Full Grooming",
        slug: "full-grooming",
        categoryId: "cat-1",
        price: 150000,
        category: { id: "cat-1", name: "Anjing", slug: "anjing" },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRelated = [
        {
          id: "svc-2",
          name: "Spa Aromaterapi",
          slug: "spa-aromaterapi",
          categoryId: "cat-1",
          price: 200000,
          category: { id: "cat-1", name: "Anjing", slug: "anjing" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.service.findFirst).mockResolvedValueOnce(
        mockMainService as unknown as Awaited<ReturnType<typeof prisma.service.findFirst>>
      );
      vi.mocked(prisma.service.findMany).mockResolvedValueOnce(
        mockRelated as unknown as Awaited<ReturnType<typeof prisma.service.findMany>>
      );

      const result = await getPublicServiceBySlug("full-grooming");

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Full Grooming");
      expect(result?.relatedServices).toHaveLength(1);
      expect(result?.relatedServices[0].slug).toBe("spa-aromaterapi");
    });

    it("mengembalikan null bila slug tidak ditemukan atau kosong", async () => {
      expect(await getPublicServiceBySlug("")).toBeNull();

      vi.mocked(prisma.service.findFirst).mockResolvedValueOnce(null);
      expect(await getPublicServiceBySlug("tidak-ada")).toBeNull();
    });

    it("memastikan kueri Prisma hanya mencari layanan dengan isActive: true dan bisnis/kategori aktif", async () => {
      vi.mocked(prisma.service.findFirst).mockResolvedValueOnce(null);

      await getPublicServiceBySlug("layanan-nonaktif");

      expect(prisma.service.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            slug: "layanan-nonaktif",
            isActive: true,
            business: { isActive: true },
            category: { isActive: true },
          },
        })
      );
    });
  });

  describe("getPublicServiceById", () => {
    it("mengambil 1 layanan aktif berdasarkan ID untuk validasi rute booking", async () => {
      vi.mocked(prisma.service.findFirst).mockResolvedValueOnce({
        id: "svc-123",
        name: "Mandi Kutu Kucing",
        slug: "mandi-kutu-kucing",
        price: 95000,
        category: { id: "cat-2", name: "Kucing", slug: "kucing" },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Awaited<ReturnType<typeof prisma.service.findFirst>>);

      const service = await getPublicServiceById("svc-123");

      expect(service).not.toBeNull();
      expect(service?.id).toBe("svc-123");
      expect(service?.formattedPrice).toContain("95.000");
    });

    it("mengembalikan null jika ID tidak ada dalam database atau bernilai kosong", async () => {
      expect(await getPublicServiceById("")).toBeNull();

      vi.mocked(prisma.service.findFirst).mockResolvedValueOnce(null);
      expect(await getPublicServiceById("unknown-id")).toBeNull();
    });
  });

  describe("getPublicGallery", () => {
    it("mengambil galeri aktif terurut dan membatasi jumlah jika limit disetel", async () => {
      vi.mocked(prisma.businessGallery.findMany).mockResolvedValueOnce([
        {
          id: "gal-1",
          objectKey: "uploads/gallery-1.jpg",
          caption: "Hasil styling anjing Poodle",
          altText: "Poodle styling",
          displayOrder: 1,
          createdAt: new Date(),
        },
      ] as unknown as Awaited<ReturnType<typeof prisma.businessGallery.findMany>>);

      const items = await getPublicGallery(6);

      expect(items).toHaveLength(1);
      expect(items[0].objectKey).toBe("uploads/gallery-1.jpg");
      expect(prisma.businessGallery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            business: { isActive: true },
          },
          take: 6,
        })
      );
    });
  });
});
