// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import GalleryPage from "@/app/(public)/gallery/page";
import AboutPage from "@/app/(public)/about/page";
import ContactPage from "@/app/(public)/contact/page";
import ServiceDetailPage from "@/app/(public)/services/[slug]/page";

const business = {
  id: "biz-1",
  name: "PawCare Grooming",
  slug: "pawcare-grooming",
  description: "Salon anabul profesional.",
  email: "halo@pawcare.id",
  phone: "081234567890",
  whatsapp: "081234567890",
  address: "Jl. A",
  fullAddress: "Jl. Boulevard Barat Raya No. 88, Kelapa Gading, Jakarta Utara",
  city: "Jakarta Utara",
  province: null,
  postalCode: null,
  googleMapsUrl: "https://maps.google.com/?q=1,2",
  timezone: "Asia/Jakarta",
  logoObjectKey: null,
};

const gallery = [1, 2, 3].map((n) => ({
  id: `g${n}`,
  objectKey: `gallery/images/foto-${n}.webp`,
  caption: `Keterangan ${n}`,
  altText: `Foto ${n}`,
  displayOrder: n,
  createdAt: new Date(),
}));

const schedule = [
  { dayOfWeek: 0, dayName: "Minggu", isOpen: false, openTime: "09:00", closeTime: "18:00", breaks: [], formattedHours: "Tutup" },
  { dayOfWeek: 1, dayName: "Senin", isOpen: true, openTime: "09:00", closeTime: "18:00", breaks: [{ startTime: "12:00", endTime: "13:00" }], formattedHours: "09:00 - 18:00" },
];

const hours = {
  isOpenNow: false,
  statusText: "Tutup Hari Ini",
  todayHours: schedule[0],
  schedule,
  timezone: "Asia/Jakarta",
};

const category = { id: "c1", name: "Grooming Kucing", slug: "grooming-kucing" };
const mkService = (id: string, name: string, price: number) => ({
  id,
  name,
  slug: id,
  description: `Deskripsi ${name}`,
  shortDescription: `Singkat ${name}`,
  fullDescription: `Lengkap ${name}`,
  durationMinutes: 60,
  bufferMinutes: 15,
  price,
  formattedPrice: `Rp ${price.toLocaleString("id-ID")}`,
  imageObjectKey: null,
  displayOrder: 1,
  category,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const getBusiness = vi.fn();
const getGallery = vi.fn();
const getServiceBySlug = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("@backend/modules/public/public-business.service", () => ({
  getPublicBusinessProfile: () => getBusiness(),
}));
vi.mock("@backend/modules/public/public-gallery.service", () => ({
  getPublicGallery: (...a: unknown[]) => getGallery(...a),
}));
vi.mock("@backend/modules/public/public-hours.service", () => ({
  getPublicOperatingHours: () => Promise.resolve(hours),
}));
vi.mock("@backend/modules/public/public-services.service", () => ({
  getPublicServiceBySlug: (...a: unknown[]) => getServiceBySlug(...a),
  getPublicCategories: () =>
    Promise.resolve([
      { id: "c1", name: "Grooming Kucing", slug: "grooming-kucing", description: null, displayOrder: 1, serviceCount: 2 },
      { id: "c2", name: "Grooming Anjing", slug: "grooming-anjing", description: null, displayOrder: 2, serviceCount: 2 },
      { id: "c3", name: "Perawatan Khusus", slug: "perawatan-khusus", description: null, displayOrder: 3, serviceCount: 1 },
    ]),
}));

beforeEach(() => {
  vi.clearAllMocks();
  getBusiness.mockResolvedValue(business);
  getGallery.mockResolvedValue(gallery);
});

describe("Halaman Galeri", () => {
  it("merender hero, judul tunggal, filter kategori, dan CTA yang benar", async () => {
    render(await GalleryPage());
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Setiap Sudut Punya Cerita.");
    expect(screen.getByRole("navigation", { name: "Filter Kategori Galeri" })).toBeDefined();

    const cta = screen.getByRole("heading", { name: /Siap Merawat Anabul Anda/i }).closest("section")!;
    expect(within(cta).getByRole("link", { name: /Booking Sekarang/i }).getAttribute("href")).toBe("/booking");
    expect(within(cta).getByRole("link", { name: /Hubungi Kami/i }).getAttribute("href")).toBe("/contact");
  });

  it("menampilkan foto database ditambah foto pelengkap", async () => {
    render(await GalleryPage());
    // 3 foto database (mock) + 18 foto pelengkap dari paket aset
    expect(screen.getAllByRole("button", { name: /^Perbesar/ })).toHaveLength(21);
  });

  it("tetap menampilkan foto pelengkap bila database belum punya foto", async () => {
    getGallery.mockResolvedValue([]);
    render(await GalleryPage());
    expect(screen.getAllByRole("button", { name: /^Perbesar/ })).toHaveLength(18);
  });
});

describe("Halaman Tentang Kami", () => {
  it("merender hero 'Lebih dari Sekadar Grooming.' dengan satu H1 dan deskripsi bisnis dari data", async () => {
    render(await AboutPage());
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(
      /Lebih dari Sekadar\s*Grooming\./
    );
    // deskripsi bisnis dari data tampil sekali (di hero), tidak diulang di bagian cerita
    expect(screen.getAllByText("Salon anabul profesional.")).toHaveLength(1);
  });

  it("cerita hanya memakai fakta dari data: lokasi, kategori, jumlah paket, jam buka", async () => {
    render(await AboutPage());
    const story = screen.getByRole("heading", { name: /Mengenal PawCare Grooming/i }).closest("section")!;
    expect(within(story).getByText(/berada di Jakarta Utara/)).toBeDefined();
    expect(within(story).getByText(/grooming kucing, grooming anjing dan perawatan khusus/)).toBeDefined();
    expect(within(story).getByText(/total 5 paket layanan/)).toBeDefined();
    expect(within(story).getByText("Jl. Boulevard Barat Raya No. 88, Kelapa Gading, Jakarta Utara")).toBeDefined();
    expect(within(story).getByText(/5 paket perawatan dalam 3 kategori/)).toBeDefined();
    expect(within(story).getByText(/Senin/)).toBeDefined();
    expect(within(story).getByText(/Tersedia online lewat halaman Booking/)).toBeDefined();
  });

  it("menampilkan empat nilai yang dijaga", async () => {
    render(await AboutPage());
    const values = screen.getByRole("heading", { name: /Yang Kami Jaga Setiap Hari/i }).closest("section")!;
    const items = within(values).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    const text = items.map((li) => li.textContent).join(" | ");
    for (const v of ["Kenyamanan Anabul", "Kebersihan", "Perhatian", "Komunikasi dengan Pemilik"]) {
      expect(text).toContain(v);
    }
  });

  it("tidak memuat klaim yang tidak dapat diverifikasi (sertifikasi, UV, penenang, akreditasi, pengalaman)", async () => {
    render(await AboutPage());
    const text = document.body.textContent || "";
    for (const forbidden of [
      /bersertifikat|bersertifikasi|tersertifikasi/i,
      /akreditasi|terakreditasi/i,
      /sinar UV|steril UV|UV steril|sterilisasi/i,
      /obat penenang/i,
      /\d+\s*tahun/i,
      /sejak\s+\d{4}/i,
      /dokter hewan|medis/i,
    ]) {
      expect(text).not.toMatch(forbidden);
    }
  });

  it("menampilkan cuplikan foto dari galeri (tanpa mengaku foto tempat/fasilitas) dan CTA yang benar", async () => {
    render(await AboutPage());
    const gal = screen.getByRole("heading", { name: /Sekilas Momen Bersama Anabul/i }).closest("section")!;
    expect(within(gal).getAllByRole("button", { name: /^Perbesar/ })).toHaveLength(6);
    expect(within(gal).getByRole("link", { name: /Buka Galeri Lengkap/i }).getAttribute("href")).toBe("/gallery");
    expect(screen.queryByText(/Ruang Tunggu|Suasana Salon/i)).toBeNull();

    const cta = screen.getByRole("heading", { name: /Mengenal Layanan Kami Lebih Dekat/i }).closest("section")!;
    expect(within(cta).getByRole("link", { name: /Lihat Layanan/i }).getAttribute("href")).toBe("/services");
    expect(within(cta).getByRole("link", { name: /Booking Sekarang/i }).getAttribute("href")).toBe("/booking");
  });

  it("tetap rapi bila deskripsi, kota, dan kategori belum terisi", async () => {
    getBusiness.mockResolvedValue({ ...business, description: null, city: null });
    render(await AboutPage());
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/Lebih dari Sekadar\s*Grooming\./);
    expect(screen.queryByText(/berada di null/)).toBeNull();
  });
});

describe("Halaman Hubungi Kami", () => {
  it("menampilkan hero, alamat, telepon, email, tautan WhatsApp/Maps, dan jadwal dari data", async () => {
    render(await ContactPage());
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Kami Senang Bisa Membantu.");
    expect(screen.getAllByText(business.fullAddress).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "081234567890" }).getAttribute("href")).toBe("tel:081234567890");
    expect(screen.getByRole("link", { name: "halo@pawcare.id" }).getAttribute("href")).toBe("mailto:halo@pawcare.id");
    expect(screen.getByRole("link", { name: /Chat via WhatsApp/i }).getAttribute("href")).toContain("https://wa.me/6281234567890");
    expect(screen.getByRole("link", { name: /Buka Petunjuk di Google Maps/i }).getAttribute("href")).toBe(business.googleMapsUrl);
    expect(screen.getByRole("link", { name: /Buka lokasi di Google Maps/i }).getAttribute("href")).toBe(business.googleMapsUrl);

    expect(screen.getByText("Senin")).toBeDefined();
    expect(screen.getAllByText(/09:00.*18:00 WIB/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Jeda: 12:00-13:00/)).toBeDefined();
    expect(screen.getByText("Asia/Jakarta")).toBeDefined();
    expect(screen.getByRole("link", { name: /OpenStreetMap contributors/i })).toBeDefined();
  });

  it("menyusun FAQ hanya dari data nyata dan tidak menampilkan form atau media sosial", async () => {
    const { container } = render(await ContactPage());
    const faq = screen.getByRole("heading", { name: /Hal yang Sering Ditanyakan/i }).closest("section")!;
    expect(within(faq).getByText("Jam berapa gerai buka?")).toBeDefined();
    expect(within(faq).getByText(/Senin:/).closest("li")!.textContent).toContain("09:00 – 18:00 WIB (jeda 12:00 – 13:00)");
    expect(within(faq).getByText(/Minggu:/).closest("li")!.textContent).toContain("Tutup");
    expect(within(faq).getByText("Bagaimana cara membuat reservasi?")).toBeDefined();
    expect(within(faq).getByRole("link", { name: "Mulai booking" }).getAttribute("href")).toBe("/booking");
    expect(within(faq).getByRole("link", { name: "Layanan" }).getAttribute("href")).toBe("/services");

    // Tidak ada formulir kontak baru dan tidak ada tautan media sosial.
    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelector("input, textarea")).toBeNull();
    expect(container.querySelector('a[href*="instagram"], a[href*="facebook"], a[href*="tiktok"]')).toBeNull();
  });

  it("memiliki CTA Booking dan ajakan melihat Layanan", async () => {
    render(await ContactPage());
    const cta = screen.getByRole("heading", { name: /Siap Membuat Jadwal/i }).closest("section")!;
    expect(within(cta).getByRole("link", { name: /Booking Sekarang/i }).getAttribute("href")).toBe("/booking");
    expect(within(cta).getByRole("link", { name: /Lihat Layanan/i }).getAttribute("href")).toBe("/services");
  });

  it("menyembunyikan WhatsApp, Maps, dan FAQ kontak bila datanya kosong", async () => {
    getBusiness.mockResolvedValue({ ...business, whatsapp: null, phone: null, email: null, googleMapsUrl: null });
    render(await ContactPage());
    expect(screen.queryByRole("link", { name: /Chat via WhatsApp/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /Buka Petunjuk di Google Maps/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /Buka lokasi di Google Maps/i })).toBeNull();
    expect(screen.queryByText(/Saya masih ingin bertanya/i)).toBeNull();
  });
});

describe("Halaman Detail Layanan", () => {
  const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

  it("merender nama, harga, durasi, tautan booking dan WhatsApp dari data layanan", async () => {
    getServiceBySlug.mockResolvedValue({
      ...mkService("s1", "Basic Cat Grooming", 85000),
      relatedServices: [mkService("s2", "Complete Cat Spa", 135000)],
    });
    render(await ServiceDetailPage(params("s1")));

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Basic Cat Grooming");
    expect(screen.getByText("Rp 85.000")).toBeDefined();
    expect(screen.getByText("Durasi 60 Menit")).toBeDefined();
    expect(screen.getByText("+15m buffer waktu")).toBeDefined();
    expect(screen.getByRole("link", { name: /Booking Layanan Ini/i }).getAttribute("href")).toBe("/booking?service=s1");
    expect(screen.getByRole("link", { name: /Tanya via WhatsApp/i }).getAttribute("href")).toContain("wa.me/6281234567890");
    expect(screen.getByRole("link", { name: /Kembali ke Katalog Layanan/i }).getAttribute("href")).toBe("/services");

    // Layanan terkait memakai kartu foto yang sama dengan daftar layanan.
    const related = screen.getByRole("heading", { name: /Layanan Terkait/i }).closest("section")!;
    expect(within(related).getByText("Complete Cat Spa")).toBeDefined();
    expect(within(related).getByText("Rp 135.000")).toBeDefined();
  });

  it("tidak menampilkan bagian layanan terkait bila tidak ada", async () => {
    getServiceBySlug.mockResolvedValue({ ...mkService("s1", "Basic Cat Grooming", 85000), relatedServices: [] });
    render(await ServiceDetailPage(params("s1")));
    expect(screen.queryByRole("heading", { name: /Layanan Terkait/i })).toBeNull();
  });

  it("memanggil notFound untuk layanan yang tidak ada", async () => {
    getServiceBySlug.mockResolvedValue(null);
    await expect(ServiceDetailPage(params("tidak-ada"))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
