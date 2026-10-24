// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/(public)/page";

const mockBusiness = {
  id: "biz-1",
  name: "PawCare Grooming",
  slug: "pawcare-grooming",
  description:
    "Layanan pet grooming profesional, higienis, dan terpercaya dengan groomer tersertifikasi untuk anjing dan kucing kesayangan Anda di Jakarta.",
  email: "halo@pawcare.id",
  phone: "+62 812-3456-7890",
  whatsapp: "081234567890",
  address: "Jl. Senopati Raya No. 42",
  fullAddress: "Jl. Senopati Raya No. 42, Kebayoran Baru, Jakarta Selatan 12190",
  city: "Jakarta",
  province: "DKI Jakarta",
  postalCode: "12190",
  googleMapsUrl: "https://maps.google.com/?q=PawCare",
  timezone: "WIB",
  logoObjectKey: null,
};

const mockServices = [
  {
    id: "srv-1",
    name: "Basic Bath",
    slug: "basic-bath",
    description: "Mandi bersih dengan sampo antiseptik lembut.",
    shortDescription: "Mandi higienis antiseptik lembut.",
    fullDescription: "Pembersihan menyeluruh seluruh tubuh.",
    durationMinutes: 45,
    bufferMinutes: 10,
    price: 65000,
    formattedPrice: "Rp 65.000",
    imageObjectKey: null,
    displayOrder: 1,
    category: { id: "cat-1", name: "Anjing & Kucing", slug: "anjing-kucing" },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "srv-2",
    name: "Full Grooming",
    slug: "full-grooming",
    description: "Paket komplit untuk penampilan segar.",
    shortDescription: "Paket komplit potong bulu dan styling.",
    fullDescription: "Semua fitur mandi plus cukur rapi.",
    durationMinutes: 90,
    bufferMinutes: 15,
    price: 120000,
    formattedPrice: "Rp 120.000",
    imageObjectKey: null,
    displayOrder: 2,
    category: { id: "cat-1", name: "Anjing & Kucing", slug: "anjing-kucing" },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "srv-3",
    name: "Premium Spa",
    slug: "premium-spa",
    description: "Perawatan spa relaksasi mewah.",
    shortDescription: "Relaksasi microbubble ozone bath.",
    fullDescription: "Spa mewah detox kulit dan pijat rileks.",
    durationMinutes: 120,
    bufferMinutes: 20,
    price: 185000,
    formattedPrice: "Rp 185.000",
    imageObjectKey: null,
    displayOrder: 3,
    category: { id: "cat-1", name: "Anjing & Kucing", slug: "anjing-kucing" },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockOperatingStatus = {
  isOpenNow: true,
  statusText: "Buka Sekarang",
  todayHours: {
    dayOfWeek: 1,
    dayName: "Senin",
    isOpen: true,
    openTime: "09:00",
    closeTime: "18:00",
    breaks: [],
    formattedHours: "09:00 - 18:00",
  },
  schedule: [
    {
      dayOfWeek: 1,
      dayName: "Senin",
      isOpen: true,
      openTime: "09:00",
      closeTime: "18:00",
      breaks: [],
      formattedHours: "09:00 - 18:00",
    },
  ],
  timezone: "WIB",
};

vi.mock("@/modules/public/public-business.service", () => ({
  getPublicBusinessProfile: vi.fn(() => Promise.resolve(mockBusiness)),
}));

vi.mock("@/modules/public/public-hours.service", () => ({
  getPublicOperatingHours: vi.fn(() => Promise.resolve(mockOperatingStatus)),
}));

vi.mock("@/modules/public/public-services.service", () => ({
  getPublicServices: vi.fn(() => Promise.resolve(mockServices)),
}));

vi.mock("@/modules/public/public-gallery.service", () => ({
  getPublicGallery: vi.fn(() => Promise.resolve([])),
}));

describe("Landing Page Dinamis (HomePage Phase 04)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender judul utama dan brand name PawCare Grooming", async () => {
    const page = await HomePage();
    render(page);

    expect(
      screen.getByRole("heading", {
        name: /Perawatan Terbaik untuk Sahabat Berbulu Anda/i,
      })
    ).toBeDefined();

    expect(screen.getAllByText(mockBusiness.name).length).toBeGreaterThan(0);
  });

  it("merender katalog layanan unggulan dengan harga dan durasi", async () => {
    const page = await HomePage();
    render(page);

    expect(screen.getByText("Basic Bath")).toBeDefined();
    expect(screen.getByText("Full Grooming")).toBeDefined();
    expect(screen.getByText("Premium Spa")).toBeDefined();

    expect(screen.getByText(/45 Menit/i)).toBeDefined();
    expect(screen.getByText(/90 Menit/i)).toBeDefined();
    expect(screen.getByText(/120 Menit/i)).toBeDefined();

    expect(screen.getByText("Rp 65.000")).toBeDefined();
    expect(screen.getByText("Rp 120.000")).toBeDefined();
    expect(screen.getByText("Rp 185.000")).toBeDefined();
  });

  it("merender 4 pilar fitur keunggulan PawCare", async () => {
    const page = await HomePage();
    render(page);

    expect(screen.getByText("Fasilitas Higienis & UV Steril")).toBeDefined();
    expect(screen.getByText("Groomer Tersertifikasi")).toBeDefined();
    expect(screen.getByText("Produk Aman & Ramah Alergi")).toBeDefined();
    expect(screen.getByText("Konfirmasi & Antrean Teratur")).toBeDefined();
  });

  it("memiliki tautan booking langsung ke halaman reservasi", async () => {
    const page = await HomePage();
    render(page);

    const bookingLinks = screen.getAllByRole("link", {
      name: /Booking Sekarang/i,
    });
    expect(bookingLinks.length).toBeGreaterThan(0);
    expect(bookingLinks[0].getAttribute("href")).toBe("/booking");
  });

  it("merender informasi jadwal dan alamat operasional bisnis", async () => {
    const page = await HomePage();
    render(page);

    expect(screen.getAllByText(mockBusiness.fullAddress).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Buka Sekarang/i).length).toBeGreaterThan(0);
  });
});

