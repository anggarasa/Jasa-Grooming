// @vitest-environment jsdom
// Tes regresi hasil QA menyeluruh (temuan axe-core dan pemeriksaan metadata).
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";

const getBusiness = vi.hoisted(() => vi.fn());
vi.mock("@backend/modules/public/public-business.service", () => ({ getPublicBusinessProfile: getBusiness }));
vi.mock("@backend/modules/bookings/token.service", () => ({
  getBookingByGuestToken: vi.fn(),
  TokenAuthError: class TokenAuthError extends Error {},
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
}));

import { FloatingWhatsAppButton } from "@/components/public/FloatingWhatsAppButton";
import { OutletMap } from "@/components/public/OutletMap";
import { PublicFooter } from "@/components/public/PublicFooter";
import { LoginForm } from "@/components/auth/LoginForm";
import { generateMetadata as manageMetadata } from "@/app/(public)/booking/manage/page";
import { generateMetadata as confirmationMetadata } from "@/app/(public)/booking/confirmation/page";
import type { PublicBusinessProfile } from "@backend/modules/public/public-business.service";
import type { PublicOperatingStatus } from "@backend/modules/public/public-hours.service";

afterEach(cleanup);

const business = {
  name: "PawCare Grooming",
  description: "Layanan grooming.",
  fullAddress: "Jl. Boulevard Barat Raya No. 88, Kelapa Gading, Jakarta Utara",
  phone: "081234567890",
  whatsapp: "081234567890",
  email: "halo@pawcare.id",
  googleMapsUrl: "https://maps.google.com/?q=-6.1553,106.9012",
} as unknown as PublicBusinessProfile;
const hours = { isOpenNow: false, statusText: "Tutup Hari Ini", todayHours: null, schedule: [], timezone: "Asia/Jakarta" } as unknown as PublicOperatingStatus;

describe("QA: nama aksesibel memuat teks yang terlihat (WCAG 2.5.3)", () => {
  it("tombol WhatsApp melayang: nama memuat 'Chat WhatsApp' (teks yang terlihat)", () => {
    render(<FloatingWhatsAppButton phone="081234567890" businessName="PawCare Grooming" />);
    const link = screen.getByRole("link", { name: /Chat WhatsApp/i });
    expect(screen.getByText("Chat WhatsApp")).toBeDefined();
    expect(link.getAttribute("aria-label")).toContain("Chat WhatsApp");
    expect(link.getAttribute("href")).toContain("https://wa.me/6281234567890");
  });

  it("tautan peta: nama memuat nama bisnis yang tampil pada pin dan tujuan tautan", () => {
    render(<OutletMap mapsUrl={business.googleMapsUrl} businessName="PawCare Grooming" className="aspect-[4/3]" />);
    const link = screen.getByRole("link", { name: /Buka lokasi di Google Maps/i });
    expect(link.getAttribute("aria-label")).toContain("PawCare Grooming");
    expect(link.getAttribute("href")).toBe(business.googleMapsUrl);
  });
});

describe("QA: struktur dokumen", () => {
  it("footer: judul kolom berlevel 2 (tidak melompat dari h1 ke h3)", () => {
    render(<PublicFooter business={business} operatingStatus={hours} />);
    const h2 = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2).toEqual(expect.arrayContaining(["Navigasi", "Layanan", "Hubungi Kami"]));
    expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
  });

  it("login: memiliki satu landmark <main> yang memuat form", () => {
    render(<LoginForm />);
    const mains = screen.getAllByRole("main");
    expect(mains).toHaveLength(1);
    expect(within(mains[0]).getByLabelText(/Email/i)).toBeDefined();
  });
});

describe("QA: halaman berdata pribadi tidak boleh diindeks", () => {
  const isNoIndex = (m: { robots?: unknown }) => {
    const r = m.robots as { index?: boolean } | string | undefined;
    return typeof r === "object" ? r?.index === false : /noindex/.test(String(r));
  };
  it("/booking/manage dan /booking/confirmation memakai noindex", async () => {
    getBusiness.mockResolvedValue(business);
    expect(isNoIndex(await manageMetadata())).toBe(true);
    expect(isNoIndex(await confirmationMetadata())).toBe(true);
  });
});

describe("QA: tombol foto galeri — nama aksesibel memuat teks yang terlihat", () => {
  it("GalleryGrid (Tentang Kami): nama memuat keterangan, atau 'Lihat Ukuran Penuh' bila tanpa keterangan", async () => {
    const { GalleryGrid } = await import("@/components/public/GalleryGrid");
    const items = [
      { id: "a", objectKey: "", caption: "Mandi busa", altText: "Bulldog dimandikan", displayOrder: 1, createdAt: new Date(0), src: "/x.jpg" },
      { id: "b", objectKey: "", caption: null, altText: "Kucing santai", displayOrder: 2, createdAt: new Date(0), src: "/y.jpg" },
    ];
    render(<GalleryGrid items={items as never} />);
    expect(screen.getByRole("button", { name: "Perbesar Bulldog dimandikan - Mandi busa" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Perbesar Kucing santai - Lihat Ukuran Penuh" })).toBeDefined();
  });

  it("GalleryExplorer: nama memuat label kategori + keterangan yang tampil di overlay", async () => {
    const { GalleryExplorer } = await import("@/components/public/gallery/GalleryExplorer");
    const items = [
      { id: "g1", objectKey: "", caption: "Potongan bulat", altText: "x", displayOrder: 1, createdAt: new Date(0), src: "/a.jpg", alt: "Anjing keriting krem", width: 4, height: 3, category: "hasil" },
      { id: "g2", objectKey: "", caption: null, altText: "y", displayOrder: 2, createdAt: new Date(0), src: "/b.jpg", alt: "Kucing santai", width: 4, height: 3, category: "momen" },
    ];
    render(<GalleryExplorer items={items as never} categories={[{ id: "hasil", label: "Hasil Grooming", count: 1 }, { id: "momen", label: "Momen Anabul", count: 1 }]} />);
    expect(screen.getByRole("button", { name: "Perbesar Anjing keriting krem - Hasil Grooming Potongan bulat" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Perbesar Kucing santai - Momen Anabul" })).toBeDefined();

    // Aturan inti WCAG 2.5.3: teks yang terlihat pada tile HARUS termuat utuh di nama aksesibelnya
    // (axe membaca teks terlihat sebagai textContent; spasi di antara span harus ada).
    for (const tile of screen.getAllByRole("button", { name: /^Perbesar/ })) {
      const visible = (tile.textContent ?? "").trim().toLowerCase();
      expect(visible.length).toBeGreaterThan(0);
      expect((tile.getAttribute("aria-label") ?? "").toLowerCase()).toContain(visible);
    }
  });
});
