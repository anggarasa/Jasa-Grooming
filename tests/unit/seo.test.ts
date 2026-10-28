import { describe, it, expect } from "vitest";
import {
  serializeJsonLd,
  constructMetadata,
  buildLocalBusinessJsonLd,
  buildServiceJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";
import { PublicBusinessProfile } from "@backend/modules/public/public-business.service";
import { PublicServiceItem } from "@backend/modules/public/public-services.service";
import { PublicOperatingHourDay } from "@backend/modules/public/public-hours.service";

describe("Technical SEO & Structured Data Helpers (Unit)", () => {
  const mockBusiness: PublicBusinessProfile = {
    id: "biz-1",
    name: "PawCare Grooming Studio",
    slug: "pawcare-grooming",
    description: "Salon grooming anjing dan kucing terpercaya.",
    email: "kontak@pawcare.id",
    phone: "08123456789",
    whatsapp: "628123456789",
    address: "Jl. Boulevard No. 10",
    fullAddress: "Jl. Boulevard No. 10, Kebayoran Baru, Jakarta Selatan",
    city: "Jakarta Selatan",
    province: "DKI Jakarta",
    postalCode: "12140",
    googleMapsUrl: "https://maps.google.com/?q=pawcare",
    timezone: "Asia/Jakarta",
    logoObjectKey: "uploads/logo.png",
  };

  const mockService: PublicServiceItem = {
    id: "svc-1",
    name: "Full Grooming Premium Anjing",
    slug: "full-grooming-anjing",
    description: "Paket lengkap mandi, potong kuku, dan styling bulu.",
    shortDescription: "Paket lengkap mandi dan styling.",
    fullDescription: "Paket lengkap mandi, pembersihan telinga, pemotongan kuku, dan styling.",
    durationMinutes: 90,
    bufferMinutes: 15,
    price: 150000,
    formattedPrice: "Rp 150.000",
    imageObjectKey: "uploads/full-grooming.jpg",
    displayOrder: 1,
    category: {
      id: "cat-1",
      name: "Anjing",
      slug: "anjing",
    },
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
  };

  const mockOperatingHours: PublicOperatingHourDay[] = [
    {
      dayOfWeek: 1, // Senin
      dayName: "Senin",
      isOpen: true,
      openTime: "09:00",
      closeTime: "18:00",
      breaks: [{ startTime: "12:00", endTime: "13:00" }],
      formattedHours: "09:00 - 18:00",
    },
    {
      dayOfWeek: 0, // Minggu
      dayName: "Minggu",
      isOpen: false,
      openTime: "09:00",
      closeTime: "18:00",
      breaks: [],
      formattedHours: "Tutup",
    },
  ];

  describe("serializeJsonLd", () => {
    it("menetralisir karakter '<' dan '>' untuk mencegah script breakout XSS", () => {
      const maliciousData = {
        name: "</script><script>alert('XSS')</script>",
      };

      const serialized = serializeJsonLd(maliciousData);

      expect(serialized).not.toContain("<script>");
      expect(serialized).not.toContain("</script>");
      expect(serialized).toContain("\\u003c/script\\u003e");
      expect(serialized).toContain("\\u003cscript\\u003e");

      // Harus tetap bisa diparse kembali secara valid oleh engine JSON
      const parsed = JSON.parse(serialized);
      expect(parsed.name).toBe("</script><script>alert('XSS')</script>");
    });

    it("menangani nilai undefined dan null secara defensif tanpa throw error", () => {
      expect(serializeJsonLd(undefined)).toBe("");
      expect(serializeJsonLd(null)).toBe("");
    });

    it("meng-escape karakter pemisah baris unicode U+2028 dan U+2029", () => {
      const dataWithUnicode = {
        desc: "Baris 1\u2028Baris 2\u2029Paragraf baru",
      };
      const serialized = serializeJsonLd(dataWithUnicode);
      expect(serialized).toContain("\\u2028");
      expect(serialized).toContain("\\u2029");
    });
  });

  describe("constructMetadata", () => {
    it("menghasilkan metadata default saat parameter kosong", () => {
      const meta = constructMetadata();

      expect(meta.description).toBeDefined();
      expect(meta.alternates?.canonical).toBeDefined();
      expect(meta.openGraph?.locale).toBe("id_ID");
      expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
      expect(meta.robots).toEqual({ index: true, follow: true });
    });

    it("menghasilkan metadata khusus dengan canonical path dan noIndex bila ditentukan", () => {
      const meta = constructMetadata({
        title: "Katalog Layanan",
        description: "Pilihan paket grooming lengkap.",
        path: "/services",
        noIndex: true,
        businessName: "PawCare",
      });

      expect(meta.title).toBe("Katalog Layanan | PawCare");
      expect(meta.description).toBe("Pilihan paket grooming lengkap.");
      expect(meta.alternates?.canonical).toContain("/services");
      expect(meta.robots).toEqual({ index: false, follow: false });
    });
  });

  describe("buildLocalBusinessJsonLd", () => {
    it("mengembalikan null jika objek bisnis kosong", () => {
      expect(buildLocalBusinessJsonLd(null)).toBeNull();
    });

    it("menghasilkan struktur Schema.org PetGroomingService yang valid", () => {
      const jsonLd = buildLocalBusinessJsonLd(mockBusiness, mockOperatingHours, "https://pawcare.id");

      expect(jsonLd).not.toBeNull();
      expect(jsonLd?.["@context"]).toBe("https://schema.org");
      expect(jsonLd?.["@type"]).toBe("PetGroomingService");
      expect(jsonLd?.name).toBe("PawCare Grooming Studio");
      expect(jsonLd?.telephone).toBe("08123456789");
      expect(jsonLd?.image).toBe("https://pawcare.id/media/uploads/logo.png");
      expect(jsonLd?.address["@type"]).toBe("PostalAddress");
      expect(jsonLd?.address.addressLocality).toBe("Jakarta Selatan");
      expect(jsonLd?.address.addressCountry).toBe("ID");

      // Hanya memasukkan hari yang buka
      expect(jsonLd?.openingHoursSpecification).toHaveLength(1);
      expect(jsonLd?.openingHoursSpecification?.[0].dayOfWeek).toBe("Monday");
      expect(jsonLd?.openingHoursSpecification?.[0].opens).toBe("09:00");
      expect(jsonLd?.openingHoursSpecification?.[0].closes).toBe("18:00");
    });
  });

  describe("buildServiceJsonLd", () => {
    it("menghasilkan struktur Schema.org Service yang valid", () => {
      const jsonLd = buildServiceJsonLd(mockService, mockBusiness, "https://pawcare.id");

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("Service");
      expect(jsonLd.name).toBe("Full Grooming Premium Anjing");
      expect(jsonLd.url).toBe("https://pawcare.id/services/full-grooming-anjing");
      expect(jsonLd.image).toBe("https://pawcare.id/media/uploads/full-grooming.jpg");
      expect(jsonLd.offers["@type"]).toBe("Offer");
      expect(jsonLd.offers.price).toBe(150000);
      expect(jsonLd.offers.priceCurrency).toBe("IDR");
      expect(jsonLd.offers.availability).toBe("https://schema.org/InStock");
    });
  });

  describe("buildBreadcrumbJsonLd", () => {
    it("menghasilkan struktur Schema.org BreadcrumbList terurut", () => {
      const crumbs = [
        { name: "Beranda", url: "https://pawcare.id" },
        { name: "Layanan", url: "https://pawcare.id/services" },
        { name: "Full Grooming", url: "https://pawcare.id/services/full-grooming" },
      ];

      const jsonLd = buildBreadcrumbJsonLd(crumbs);

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("BreadcrumbList");
      expect(jsonLd.itemListElement).toHaveLength(3);
      expect(jsonLd.itemListElement[0]).toEqual({
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: "https://pawcare.id",
      });
      expect(jsonLd.itemListElement[2]).toEqual({
        "@type": "ListItem",
        position: 3,
        name: "Full Grooming",
        item: "https://pawcare.id/services/full-grooming",
      });
    });
  });
});
