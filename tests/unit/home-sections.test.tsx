// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { summarizeSchedule } from "@/components/public/home/schedule";
import { resolveServicePhoto } from "@/components/public/home/service-photos";
import {
  HomeServices,
  type HomeServiceData,
} from "@/components/public/home/HomeServices";
import { HomeMoments } from "@/components/public/home/HomeMoments";
import { HomeOutlet } from "@/components/public/home/HomeOutlet";
import type { PublicOperatingHourDay } from "@backend/modules/public/public-hours.service";
import type { PublicBusinessProfile } from "@backend/modules/public/public-business.service";
import type { PublicGalleryItem } from "@backend/modules/public/public-gallery.service";

const day = (
  dayOfWeek: number,
  dayName: string,
  isOpen: boolean,
  breaks: { startTime: string; endTime: string }[] = [],
  openTime = "09:00",
  closeTime = "18:00"
): PublicOperatingHourDay => ({
  dayOfWeek,
  dayName,
  isOpen,
  openTime,
  closeTime,
  breaks,
  formattedHours: isOpen ? `${openTime} - ${closeTime}` : "Tutup",
});

const lunch = [{ startTime: "12:00", endTime: "13:00" }];

const weekly: PublicOperatingHourDay[] = [
  day(0, "Minggu", false),
  day(1, "Senin", true, lunch),
  day(2, "Selasa", true, lunch),
  day(3, "Rabu", true, lunch),
  day(4, "Kamis", true, lunch),
  day(5, "Jumat", true, lunch),
  day(6, "Sabtu", true, lunch),
];

describe("summarizeSchedule", () => {
  it("menggabungkan hari berurutan dengan jam sama dan menaruh Minggu di akhir", () => {
    const rows = summarizeSchedule(weekly);
    expect(rows).toEqual([
      {
        label: "Senin – Sabtu",
        hours: "09:00 – 18:00",
        breakText: "12:00 – 13:00",
        closed: false,
      },
      { label: "Minggu", hours: null, breakText: null, closed: true },
    ]);
  });

  it("memisahkan hari yang jamnya berbeda", () => {
    const schedule = [
      day(1, "Senin", true, lunch),
      day(2, "Selasa", true, lunch, "10:00", "17:00"),
    ];
    const rows = summarizeSchedule(schedule);
    expect(rows.map((r) => r.label)).toEqual(["Senin", "Selasa"]);
    expect(rows[1].hours).toBe("10:00 – 17:00");
  });

  it("tidak mengarang hari: jadwal kosong menghasilkan daftar kosong", () => {
    expect(summarizeSchedule([])).toEqual([]);
  });
});

describe("resolveServicePhoto", () => {
  it("mengembalikan null bila layanan tidak punya foto", () => {
    expect(resolveServicePhoto(null, "X")).toBeNull();
  });

  it("memakai foto pengganti hanya untuk kunci foto stok bawaan seed", () => {
    const photo = resolveServicePhoto("services/images/cat-basic.webp", "Basic Cat Grooming");
    expect(photo?.src).toBe("/images/photos/p-1625279138876.jpg");
  });

  it("mempertahankan foto unggahan admin (kunci selain bawaan seed)", () => {
    const photo = resolveServicePhoto("services/images/custom-upload-123.webp", "Layanan Baru");
    expect(photo?.src).toBe("/media/services/images/custom-upload-123.webp");
    expect(photo?.alt).toBe("Foto layanan Layanan Baru");
  });
});

const category = (id: string, name: string, slug: string) => ({ id, name, slug });
const svc = (
  id: string,
  name: string,
  cat: { id: string; name: string; slug: string }
): HomeServiceData => ({
  id,
  name,
  slug: id,
  description: `Deskripsi ${name}`,
  shortDescription: null,
  durationMinutes: 60,
  formattedPrice: "Rp 100.000",
  imageObjectKey: null,
  category: cat,
});

const catCat = category("c1", "Grooming Kucing", "grooming-kucing");
const dogCat = category("c2", "Grooming Anjing", "grooming-anjing");

describe("HomeServices", () => {
  const services = [
    svc("s1", "Mandi Kucing", catCat),
    svc("s2", "Spa Kucing", catCat),
    svc("s3", "Mandi Anjing", dogCat),
  ];

  it("menampilkan semua layanan dan kartu konsultasi WhatsApp", () => {
    render(<HomeServices services={services} whatsappUrl="https://wa.me/62812" />);

    expect(screen.getByText("Mandi Kucing")).toBeDefined();
    expect(screen.getByText("Spa Kucing")).toBeDefined();
    expect(screen.getByText("Mandi Anjing")).toBeDefined();

    const wa = screen.getByRole("link", { name: /Konsultasikan Via WhatsApp/i });
    expect(wa.getAttribute("href")).toBe("https://wa.me/62812");
  });

  it("memfilter layanan berdasarkan kategori dan dapat direset", () => {
    render(<HomeServices services={services} whatsappUrl={null} />);

    const filter = screen.getByRole("navigation", { name: "Filter Kategori Layanan" });
    const semua = within(filter).getByRole("button", { name: "Semua" });
    expect(semua.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(within(filter).getByRole("button", { name: "Grooming Anjing" }));
    expect(screen.queryByText("Mandi Kucing")).toBeNull();
    expect(screen.getByText("Mandi Anjing")).toBeDefined();
    expect(
      within(filter).getByRole("button", { name: "Grooming Anjing" }).getAttribute("aria-pressed")
    ).toBe("true");
    expect(screen.getByRole("status").textContent).toMatch(/1 layanan kategori Grooming Anjing/);

    fireEvent.click(semua);
    expect(screen.getByText("Mandi Kucing")).toBeDefined();
  });

  it("tidak menampilkan filter bila hanya ada satu kategori", () => {
    render(
      <HomeServices services={[svc("s1", "Mandi Kucing", catCat)]} whatsappUrl={null} />
    );
    expect(screen.queryByRole("navigation", { name: "Filter Kategori Layanan" })).toBeNull();
  });

  it("memakai tautan reservasi bila bisnis tidak punya nomor WhatsApp", () => {
    render(<HomeServices services={services} whatsappUrl={null} />);
    expect(screen.queryByRole("link", { name: /WhatsApp/i })).toBeNull();
    const fallback = screen.getByRole("link", { name: /Reservasi Sekarang/i });
    expect(fallback.getAttribute("href")).toBe("/booking");
  });

  it("menautkan setiap kartu ke detail dan booking layanan yang benar", () => {
    render(<HomeServices services={[svc("s1", "Mandi Kucing", catCat)]} whatsappUrl={null} />);
    expect(screen.getByRole("link", { name: "Mandi Kucing" }).getAttribute("href")).toBe(
      "/services/s1"
    );
    expect(screen.getByRole("link", { name: /^Booking/ }).getAttribute("href")).toBe(
      "/booking?service=s1"
    );
  });

  it("menampilkan pesan kosong bila tidak ada layanan", () => {
    render(<HomeServices services={[]} whatsappUrl={null} />);
    expect(screen.getByText(/Daftar layanan sedang diperbarui/i)).toBeDefined();
  });
});

const galleryItem = (n: number): PublicGalleryItem => ({
  id: `g${n}`,
  objectKey: `gallery/images/foto-${n}.webp`,
  caption: `Keterangan ${n}`,
  altText: `Foto ${n}`,
  displayOrder: n,
  createdAt: new Date(),
});

describe("HomeMoments", () => {
  it("menampilkan paling banyak 5 foto dan menuju halaman galeri", () => {
    render(<HomeMoments items={[1, 2, 3, 4, 5, 6].map(galleryItem)} />);
    expect(screen.getAllByRole("button", { name: /Perbesar/i })).toHaveLength(5);
    const cta = screen.getByRole("link", { name: /Lihat Semua Momen/i });
    expect(cta.getAttribute("href")).toBe("/gallery");
  });

  it("membuka lightbox saat foto diklik", () => {
    render(<HomeMoments items={[1, 2, 3, 4].map(galleryItem)} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    // Nama aksesibel memuat teks yang terlihat (keterangan foto) — WCAG 2.5.3
    fireEvent.click(screen.getByRole("button", { name: "Perbesar Foto 2 - Keterangan 2" }));
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("tetap menampilkan judul dan tautan galeri tanpa foto", () => {
    render(<HomeMoments items={[]} />);
    expect(screen.getByRole("heading", { name: /Lebih Dekat Dengan Dunia PawCare/i })).toBeDefined();
    expect(screen.queryAllByRole("button", { name: /Perbesar/i })).toHaveLength(0);
  });
});

const business: PublicBusinessProfile = {
  id: "b1",
  name: "PawCare Grooming",
  slug: "pawcare",
  description: null,
  email: "halo@pawcare.id",
  phone: "081234567890",
  whatsapp: "081234567890",
  address: "Jl. A",
  fullAddress: "Jl. Boulevard Barat Raya No. 88, Kelapa Gading",
  city: "Jakarta Utara",
  province: null,
  postalCode: null,
  googleMapsUrl: "https://maps.google.com/?q=1,2",
  timezone: "Asia/Jakarta",
  logoObjectKey: null,
};

const status = {
  isOpenNow: false,
  statusText: "Tutup Hari Ini",
  todayHours: weekly[0],
  schedule: weekly,
  timezone: "Asia/Jakarta",
};

describe("HomeOutlet", () => {
  it("menampilkan alamat, status, jam ringkas, kontak, dan tautan Google Maps dari data", () => {
    render(<HomeOutlet business={business} operatingStatus={status} />);

    expect(screen.getByText(business.fullAddress!)).toBeDefined();
    expect(screen.getByText("Tutup Hari Ini")).toBeDefined();
    expect(screen.getByText(/Senin – Sabtu/)).toBeDefined();
    expect(screen.getByText(/Istirahat \| 12:00 – 13:00/)).toBeDefined();
    expect(screen.getByText("Libur")).toBeDefined();
    expect(screen.getByRole("link", { name: "halo@pawcare.id" }).getAttribute("href")).toBe(
      "mailto:halo@pawcare.id"
    );

    const maps = screen.getAllByRole("link").filter((a) => a.getAttribute("href") === business.googleMapsUrl);
    expect(maps.length).toBeGreaterThanOrEqual(2); // peta + tombol "Petunjuk Arah"
    expect(screen.getByRole("link", { name: /Petunjuk Arah/i })).toBeDefined();
  });

  it("selalu mencantumkan atribusi OpenStreetMap di dekat peta", () => {
    render(<HomeOutlet business={business} operatingStatus={status} />);
    const credit = screen.getByRole("link", { name: /OpenStreetMap contributors/i });
    expect(credit.getAttribute("href")).toBe("https://www.openstreetmap.org/copyright");
  });

  it("tidak membuat tautan peta atau tombol arah bila googleMapsUrl kosong", () => {
    render(
      <HomeOutlet business={{ ...business, googleMapsUrl: null }} operatingStatus={status} />
    );
    expect(screen.queryByRole("link", { name: /Petunjuk Arah/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /Buka lokasi di Google Maps/i })).toBeNull();
  });
});
