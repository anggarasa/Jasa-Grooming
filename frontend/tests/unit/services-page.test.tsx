// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import ServicesPage from "@/app/(public)/services/page";

const mockBusiness = {
  id: "biz-1",
  name: "PawCare Grooming",
  slug: "pawcare-grooming",
  description: null,
  email: "halo@pawcare.id",
  phone: "081234567890",
  whatsapp: "081234567890",
  address: "Jl. A",
  fullAddress: "Jl. A No. 1",
  city: "Jakarta Utara",
  province: null,
  postalCode: null,
  googleMapsUrl: null,
  timezone: "Asia/Jakarta",
  logoObjectKey: null,
};

const kucing = { id: "c1", name: "Grooming Kucing", slug: "grooming-kucing" };
const anjing = { id: "c2", name: "Grooming Anjing", slug: "grooming-anjing" };

const mkService = (
  id: string,
  name: string,
  price: number,
  duration: number,
  category: { id: string; name: string; slug: string }
) => ({
  id,
  name,
  slug: id,
  description: `Deskripsi ${name}`,
  shortDescription: `Singkat ${name}`,
  fullDescription: null,
  durationMinutes: duration,
  bufferMinutes: 10,
  price,
  formattedPrice: `Rp ${price.toLocaleString("id-ID")}`,
  imageObjectKey: null,
  displayOrder: 1,
  category,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mockServices = [
  mkService("s1", "Mandi Kucing", 85000, 60, kucing),
  mkService("s2", "Potong Anjing", 165000, 90, anjing),
];

const mockCategories = [
  { id: "c1", name: "Grooming Kucing", slug: "grooming-kucing", description: null, displayOrder: 1, serviceCount: 1 },
  { id: "c2", name: "Grooming Anjing", slug: "grooming-anjing", description: null, displayOrder: 2, serviceCount: 1 },
];

const getServices = vi.fn();
const getBusiness = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/services",
}));

vi.mock("@backend/modules/public/public-services.service", () => ({
  getPublicCategories: vi.fn(() => Promise.resolve(mockCategories)),
  getPublicServices: (...args: unknown[]) => getServices(...args),
}));

vi.mock("@backend/modules/public/public-business.service", () => ({
  getPublicBusinessProfile: () => getBusiness(),
}));

async function renderPage(params: { category?: string; search?: string } = {}) {
  const page = await ServicesPage({ searchParams: Promise.resolve(params) });
  return render(page);
}

describe("Halaman Layanan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServices.mockResolvedValue(mockServices);
    getBusiness.mockResolvedValue(mockBusiness);
  });

  it("merender hero dengan satu H1 dan dua CTA", async () => {
    await renderPage();

    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toMatch(
      /Perawatan Penuh Kasih,\s*untuk Anabul Kesayangan\./
    );

    const hero = screen.getByRole("heading", { level: 1 }).closest("section")!;
    expect(within(hero).getByRole("link", { name: /Booking Sekarang/i }).getAttribute("href")).toBe("/booking");
    expect(within(hero).getByRole("link", { name: /Lihat Paket/i }).getAttribute("href")).toBe("#paket");
  });

  it("menampilkan empat kategori perawatan yang menuju daftar paket", async () => {
    await renderPage();
    const section = screen
      .getByRole("heading", { name: /Perawatan Untuk Setiap Kebutuhan Anabul/i })
      .closest("section")!;

    for (const title of [
      "Mandi & Perawatan Kebersihan",
      "Styling & Potong Bulu",
      "Spa & Relaksasi",
      "Perawatan Medicated",
    ]) {
      expect(within(section).getByRole("heading", { name: title })).toBeDefined();
      expect(
        within(section).getByRole("link", { name: `Lihat paket: ${title}` }).getAttribute("href")
      ).toBe("/services#paket");
    }
  });

  it("memakai data layanan aktual: nama, harga, durasi, kategori, dan tautan", async () => {
    await renderPage();
    const list = document.getElementById("paket")!;

    expect(within(list).getByText("Mandi Kucing")).toBeDefined();
    expect(within(list).getByText("Potong Anjing")).toBeDefined();
    expect(within(list).getByText("Rp 85.000")).toBeDefined();
    expect(within(list).getByText("Rp 165.000")).toBeDefined();
    expect(within(list).getByText("60 Menit")).toBeDefined();
    expect(within(list).getByText("90 Menit")).toBeDefined();

    const card = within(list).getByRole("link", { name: "Mandi Kucing" });
    expect(card.getAttribute("href")).toBe("/services/s1");
    expect(
      within(list)
        .getAllByRole("link", { name: /^Booking/ })
        .map((a) => a.getAttribute("href"))
    ).toContain("/booking?service=s1");

    // kategori ditampilkan pada kartu (selain tombol filter)
    expect(within(list).getAllByText("Grooming Kucing").length).toBeGreaterThan(0);
  });

  it("meneruskan filter kategori dan pencarian ke sumber data", async () => {
    getServices.mockResolvedValue([mockServices[0]]);
    await renderPage({ category: "grooming-kucing", search: "mandi" });

    expect(getServices).toHaveBeenCalledWith({
      categorySlug: "grooming-kucing",
      search: "mandi",
    });

    const status = screen.getByRole("status");
    expect(status.textContent).toMatch(/1\s*layanan/);
    expect(status.textContent).toMatch(/Grooming Kucing/);
    expect(status.textContent).toMatch(/mandi/);
    expect(screen.getByRole("link", { name: /Reset Filter/i }).getAttribute("href")).toBe(
      "/services#paket"
    );
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("mandi");
    expect(
      document.querySelector('input[type="hidden"][name="category"]')?.getAttribute("value")
    ).toBe("grooming-kucing");
  });

  it("tidak menampilkan Reset Filter tanpa filter aktif", async () => {
    await renderPage();
    expect(screen.queryByRole("link", { name: /Reset Filter/i })).toBeNull();
  });

  it("menampilkan keadaan kosong dan jalan keluar bila tidak ada layanan", async () => {
    getServices.mockResolvedValue([]);
    await renderPage({ search: "tidak-ada" });
    expect(screen.getByText("Tidak Ada Layanan yang Cocok")).toBeDefined();
    expect(
      screen.getByRole("link", { name: /Tampilkan Semua Layanan/i }).getAttribute("href")
    ).toBe("/services#paket");
  });

  it("menjelaskan alur booking sesuai enam langkah aktual", async () => {
    await renderPage();
    const section = screen
      .getByRole("heading", { name: /Booking Dalam Enam Langkah/i })
      .closest("section")!;
    const items = within(section).getAllByRole("listitem");
    expect(items).toHaveLength(6);
    const text = items.map((li) => li.textContent).join(" | ");
    for (const step of [
      "Pilih Layanan",
      "Pilih Tanggal",
      "Pilih Jam",
      "Data Pemilik",
      "Data Anabul",
      "Konfirmasi",
    ]) {
      expect(text).toContain(step);
    }
  });

  it("CTA akhir menuju booking dan WhatsApp hanya bila nomor tersedia", async () => {
    await renderPage();
    const cta = screen.getByRole("heading", { name: /Sudah Menemukan Paket Yang Cocok/i }).closest("section")!;
    expect(within(cta).getByRole("link", { name: /Booking Sekarang/i }).getAttribute("href")).toBe("/booking");
    expect(within(cta).getByRole("link", { name: /Konsultasi Via WhatsApp/i }).getAttribute("href")).toContain(
      "https://wa.me/6281234567890"
    );
  });

  it("menyembunyikan tombol WhatsApp bila bisnis tidak punya nomor", async () => {
    getBusiness.mockResolvedValue({ ...mockBusiness, whatsapp: null, phone: null });
    await renderPage();
    const cta = screen.getByRole("heading", { name: /Sudah Menemukan Paket Yang Cocok/i }).closest("section")!;
    expect(within(cta).queryByRole("link", { name: /WhatsApp/i })).toBeNull();
    expect(within(cta).getByRole("link", { name: /Booking Sekarang/i })).toBeDefined();
  });
});
