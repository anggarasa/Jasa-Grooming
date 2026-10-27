// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { ServiceCard } from "@/components/public/ServiceCard";
import { FloatingWhatsAppButton } from "@/components/public/FloatingWhatsAppButton";
import { GalleryGrid } from "@/components/public/GalleryGrid";
import { OperatingHoursTable } from "@/components/public/OperatingHoursTable";
import { CategoryFilterPills } from "@/components/public/CategoryFilterPills";
import { BookingTransitionCard } from "@/components/public/BookingTransitionCard";
import { PublicBusinessProfile } from "@backend/modules/public/public-business.service";
import { PublicOperatingStatus } from "@backend/modules/public/public-hours.service";
import { PublicServiceItem, PublicCategory } from "@backend/modules/public/public-services.service";
import { PublicGalleryItem } from "@backend/modules/public/public-gallery.service";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockBusiness: PublicBusinessProfile = {
  id: "biz-1",
  name: "PawCare Grooming",
  slug: "pawcare-grooming",
  description: "Layanan pet grooming profesional dan ramah di Jakarta.",
  email: "halo@pawcare.id",
  phone: "+62 812-3456-7890",
  whatsapp: "081234567890",
  address: "Jl. Senopati No. 42",
  fullAddress: "Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan",
  city: "Jakarta",
  province: "DKI Jakarta",
  postalCode: "12190",
  googleMapsUrl: "https://maps.google.com/?q=PawCare",
  timezone: "WIB",
  logoObjectKey: "business/logos/logo.webp",
};

const mockOperatingStatus: PublicOperatingStatus = {
  isOpenNow: true,
  statusText: "Buka Sekarang",
  todayHours: {
    dayOfWeek: 1,
    dayName: "Senin",
    isOpen: true,
    openTime: "09:00",
    closeTime: "18:00",
    breaks: [{ startTime: "12:00", endTime: "13:00" }],
    formattedHours: "09:00 - 18:00",
  },
  schedule: [
    {
      dayOfWeek: 0,
      dayName: "Minggu",
      isOpen: false,
      openTime: "09:00",
      closeTime: "18:00",
      breaks: [],
      formattedHours: "Tutup",
    },
    {
      dayOfWeek: 1,
      dayName: "Senin",
      isOpen: true,
      openTime: "09:00",
      closeTime: "18:00",
      breaks: [{ startTime: "12:00", endTime: "13:00" }],
      formattedHours: "09:00 - 18:00",
    },
  ],
  timezone: "WIB",
};

const mockServiceItem: PublicServiceItem = {
  id: "srv-bath",
  name: "Basic Bath Sanitasi",
  slug: "basic-bath-sanitasi",
  description: "Mandi higienis dengan sampo organik ramah alergi.",
  shortDescription: "Mandi higienis sampo organik.",
  fullDescription: "Pembersihan menyeluruh telinga, kuku, dan bulu.",
  durationMinutes: 45,
  bufferMinutes: 15,
  price: 65000,
  formattedPrice: "Rp 65.000",
  imageObjectKey: "services/images/bath.webp",
  displayOrder: 1,
  category: {
    id: "cat-1",
    name: "Anjing & Kucing",
    slug: "anjing-kucing",
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCategories: PublicCategory[] = [
  {
    id: "cat-1",
    name: "Anjing & Kucing",
    slug: "anjing-kucing",
    description: "Layanan umum",
    displayOrder: 1,
    serviceCount: 4,
  },
  {
    id: "cat-2",
    name: "Spesial Spa",
    slug: "spesial-spa",
    description: "Layanan spa",
    displayOrder: 2,
    serviceCount: 2,
  },
];

const mockGalleryItems: PublicGalleryItem[] = [
  {
    id: "gal-1",
    objectKey: "gallery/images/foto1.webp",
    caption: "Area Grooming Bersih Ber-AC",
    altText: "Ruangan salon bersih dengan meja hidrolik",
    displayOrder: 0,
    createdAt: new Date(),
  },
  {
    id: "gal-2",
    objectKey: "gallery/images/foto2.webp",
    caption: "Kucing Persia Selesai Mandi Spa",
    altText: "Kucing persia putih bersih",
    displayOrder: 1,
    createdAt: new Date(),
  },
];

describe("PublicHeader Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender nama bisnis, tautan navigasi desktop, dan tombol booking", () => {
    render(
      <PublicHeader
        business={mockBusiness}
        operatingStatus={mockOperatingStatus}
      />
    );

    // Merek tampil sebagai logo gambar (A-01): nama bisnis menjadi alt logo.
    expect(screen.getAllByAltText("PawCare Grooming").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Beranda" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Layanan" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Galeri" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Tentang Kami" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Hubungi Kami" })).toBeDefined();

    const bookingBtns = screen.getAllByRole("link", { name: /Booking Sekarang/i });
    expect(bookingBtns.length).toBeGreaterThan(0);
    expect(bookingBtns[0].getAttribute("href")).toBe("/booking");
  });

  it("merender logo PawCare hijau (berkas dari pemilik) pada header", () => {
    render(
      <PublicHeader
        business={mockBusiness}
        operatingStatus={mockOperatingStatus}
      />
    );

    const logoImg = screen.getByAltText("PawCare Grooming");
    expect(logoImg).toBeDefined();
    expect(logoImg.getAttribute("src")).toBe("/images/brand/logo-pawcare-hijau.png");
  });

  it("merender indikator status operasional Buka Sekarang", () => {
    render(
      <PublicHeader
        business={mockBusiness}
        operatingStatus={mockOperatingStatus}
      />
    );

    expect(screen.getByText("Buka Sekarang")).toBeDefined();
  });

  it("dapat membuka mobile sheet navigasi", () => {
    render(
      <PublicHeader
        business={mockBusiness}
        operatingStatus={mockOperatingStatus}
      />
    );

    const menuBtn = screen.getByRole("button", { name: /Buka Menu Navigasi/i });
    fireEvent.click(menuBtn);

    expect(screen.getByText("Layanan Grooming Hewan Profesional")).toBeDefined();
    expect(screen.getByRole("link", { name: /Booking Jadwal/i })).toBeDefined();

    // Menu mobile customer tidak memuat tautan login (khusus owner/staf).
    expect(screen.queryByRole("link", { name: /Portal Masuk|Admin|Masuk/i })).toBeNull();
    expect(document.querySelector('a[href="/login"]')).toBeNull();
  });
});

describe("PublicFooter Component", () => {
  it("merender deskripsi bisnis, alamat, tautan WhatsApp, dan hak cipta", () => {
    render(
      <PublicFooter
        business={mockBusiness}
        operatingStatus={mockOperatingStatus}
      />
    );

    expect(screen.getByText(mockBusiness.description!)).toBeDefined();
    expect(screen.getByText(mockBusiness.fullAddress!)).toBeDefined();
    expect(screen.getByText("Chat WhatsApp Kami")).toBeDefined();
    expect(screen.getByText(/Seluruh hak cipta dilindungi/i)).toBeDefined();
    // Halaman login hanya untuk owner/staf: tidak ada tautan login di sisi customer.
    expect(screen.queryByRole("link", { name: /Area Staf|Admin|Masuk/i })).toBeNull();
    expect(document.querySelector('a[href="/login"]')).toBeNull();
  });
});

describe("FloatingWhatsAppButton Component", () => {
  it("merender tombol WhatsApp mengambang dengan nomor terformat", () => {
    render(
      <FloatingWhatsAppButton
        phone={mockBusiness.whatsapp}
        businessName={mockBusiness.name}
      />
    );

    const waLink = screen.getByRole("link", {
      name: /Chat WhatsApp dengan kami/i,
    });
    expect(waLink).toBeDefined();
    expect(waLink.getAttribute("href")).toContain("https://wa.me/6281234567890");
    expect(screen.getByText("Chat WhatsApp")).toBeDefined();
  });

  it("mengembalikan null jika nomor telepon kosong", () => {
    const { container } = render(
      <FloatingWhatsAppButton phone={null} businessName="PawCare" />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("ServiceCard Component", () => {
  it("merender nama layanan, badge kategori, durasi, dan harga Rupiah", () => {
    render(<ServiceCard service={mockServiceItem} />);

    expect(screen.getByText("Basic Bath Sanitasi")).toBeDefined();
    expect(screen.getByText("Anjing & Kucing")).toBeDefined();
    expect(screen.getByText("45 Menit")).toBeDefined();
    expect(screen.getByText("+15m buffer")).toBeDefined();
    expect(screen.getByText("Rp 65.000")).toBeDefined();

    const detailLink = screen.getByRole("link", { name: /Detail/i });
    expect(detailLink.getAttribute("href")).toBe("/services/basic-bath-sanitasi");

    const bookingLink = screen.getByRole("link", { name: /Booking/i });
    expect(bookingLink.getAttribute("href")).toBe("/booking?service=srv-bath");
  });
});

describe("GalleryGrid & GalleryLightbox Components", () => {
  it("merender kartu galeri dan membuka lightbox saat diklik", () => {
    render(<GalleryGrid items={mockGalleryItems} />);

    expect(screen.getByAltText("Ruangan salon bersih dengan meja hidrolik")).toBeDefined();
    expect(screen.getByAltText("Kucing persia putih bersih")).toBeDefined();

    const firstCard = screen.getByRole("button", {
      name: /Perbesar Ruangan salon bersih dengan meja hidrolik/i,
    });
    fireEvent.click(firstCard);

    // Lightbox modal terbuka
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(screen.getByText("1 / 2")).toBeDefined();
    expect(screen.getAllByText("Area Grooming Bersih Ber-AC").length).toBeGreaterThan(0);

    // Tombol tutup menerima initial focus sesuai WCAG 2.2 AA
    const closeBtn = screen.getByRole("button", { name: "Tutup pratinjau foto" });
    expect(document.activeElement).toBe(closeBtn);

    // Tombol tutup menutup modal
    fireEvent.click(closeBtn);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("mendukung interaksi keyboard Escape dan tombol panah navigasi", () => {
    render(<GalleryGrid items={mockGalleryItems} />);

    const firstCard = screen.getByRole("button", {
      name: /Perbesar Ruangan salon bersih dengan meja hidrolik/i,
    });
    fireEvent.click(firstCard);

    // Navigasi ke foto berikutnya dengan tombol panah kanan
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("2 / 2")).toBeDefined();
    expect(screen.getAllByText("Kucing Persia Selesai Mandi Spa").length).toBeGreaterThan(0);

    // Navigasi kembali dengan tombol panah kiri
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("1 / 2")).toBeDefined();

    // Tutup dialog dengan tombol Escape
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("merender empty state jika galeri kosong", () => {
    render(<GalleryGrid items={[]} />);
    expect(screen.getByText("Belum Ada Foto dalam Galeri")).toBeDefined();
  });
});

describe("OperatingHoursTable Component", () => {
  it("merender jadwal mingguan dengan badge buka/tutup dan jeda istirahat", () => {
    render(
      <OperatingHoursTable
        schedule={mockOperatingStatus.schedule}
        todayDayOfWeek={1}
        isOpenNow={true}
        statusText="Buka Sekarang"
      />
    );

    expect(screen.getByText("Jadwal Operasional Mingguan")).toBeDefined();
    expect(screen.getByText("Senin")).toBeDefined();
    expect(screen.getByText("Minggu")).toBeDefined();
    expect(screen.getByText("Hari Ini")).toBeDefined();
    expect(screen.getByText(/09:00 – 18:00 WIB/i)).toBeDefined();
    expect(screen.getByText(/Jeda: 12:00-13:00/i)).toBeDefined();
    expect(screen.getByText("Tutup / Libur")).toBeDefined();
  });
});

describe("CategoryFilterPills Component", () => {
  it("merender tombol Semua Layanan dan pil kategori dengan jumlah layanan", () => {
    render(
      <CategoryFilterPills
        categories={mockCategories}
        activeCategorySlug="spesial-spa"
        totalServicesCount={6}
      />
    );

    expect(screen.getByText("Semua Layanan")).toBeDefined();
    expect(screen.getByText("Spesial Spa")).toBeDefined();
    expect(screen.getByText("Anjing & Kucing")).toBeDefined();

    // Klik kategori mendorong perubahan router push
    const catBtn = screen.getByRole("button", { name: /Anjing & Kucing/i });
    fireEvent.click(catBtn);
    expect(mockPush).toHaveBeenCalledWith("/services?category=anjing-kucing", {
      scroll: false,
    });
  });
});

describe("BookingTransitionCard Component", () => {
  it("merender kartu layanan terpilih dan tombol konfirmasi WhatsApp", () => {
    render(
      <BookingTransitionCard
        selectedService={mockServiceItem}
        business={mockBusiness}
      />
    );

    expect(screen.getByText("Sistem Reservasi Mandiri Online Segera Hadir")).toBeDefined();
    expect(screen.getByText("Basic Bath Sanitasi")).toBeDefined();
    expect(screen.getByText("Rp 65.000")).toBeDefined();

    const waBtn = screen.getByRole("link", {
      name: /Konfirmasi Booking via WhatsApp/i,
    });
    expect(waBtn).toBeDefined();
    expect(waBtn.getAttribute("href")).toContain("https://wa.me/6281234567890");
    expect(waBtn.getAttribute("href")).toContain(encodeURIComponent("Basic Bath Sanitasi"));
  });

  it("merender notice untuk memilih layanan jika belum ada layanan yang dipilih", () => {
    render(
      <BookingTransitionCard
        selectedService={null}
        business={mockBusiness}
      />
    );

    expect(screen.getByText("Belum Memilih Layanan Grooming")).toBeDefined();
    expect(screen.getByRole("link", { name: /Buka Katalog Layanan/i })).toBeDefined();
  });
});
