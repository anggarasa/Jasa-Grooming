// @vitest-environment jsdom
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

const getBooking = vi.hoisted(() => vi.fn());
const getBusiness = vi.hoisted(() => vi.fn());

vi.mock("@backend/modules/bookings/token.service", () => {
  class TokenAuthError extends Error {
    statusCode: number;
    code: string;
    constructor(message: string, statusCode = 404, code = "NOT_FOUND") {
      super(message);
      this.name = "TokenAuthError";
      this.statusCode = statusCode;
      this.code = code;
    }
  }
  return { getBookingByGuestToken: getBooking, TokenAuthError };
});
vi.mock("@backend/modules/public/public-business.service", () => ({ getPublicBusinessProfile: getBusiness }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import BookingConfirmationPage, { generateMetadata } from "@/app/(public)/booking/confirmation/page";
import { BookingConfirmationCard } from "@/components/booking/BookingConfirmationCard";
import { TokenAuthError } from "@backend/modules/bookings/token.service";
import type { ManagedBookingDto } from "@backend/modules/bookings/token.service";
import type { PublicBusinessProfile } from "@backend/modules/public/public-business.service";

const business = {
  name: "PawCare Grooming",
  fullAddress: "Jl. Boulevard Barat Raya No. 88, Kelapa Gading, Jakarta Utara",
  whatsapp: "081234567890",
  phone: "081234567890",
  googleMapsUrl: "https://maps.google.com/?q=-6.1553,106.9012",
} as unknown as PublicBusinessProfile;

const booking = (over: Partial<ManagedBookingDto> = {}): ManagedBookingDto => ({
  id: "b1",
  bookingCode: "GRM-20261024-ABCD",
  status: "PENDING" as ManagedBookingDto["status"],
  startAt: "2026-10-24T02:00:00.000Z", // Sabtu 24 Okt 2026, 09:00 WIB
  endAt: "2026-10-24T03:00:00.000Z",
  serviceEndAt: "2026-10-24T03:00:00.000Z",
  occupancyEndAt: "2026-10-24T03:15:00.000Z",
  serviceName: "Basic Cat Grooming",
  durationMinutes: 60,
  totalPrice: 85000,
  customerNotes: null,
  customer: { name: "Sarah Wijaya", phone: "081234567890", email: null },
  pet: { name: "Milo", type: "Kucing", breed: null, age: null, notes: null },
  stationName: "Main",
  canCancel: true,
  cancellationWindowHours: 24,
  createdAt: "2026-10-23T05:00:00.000Z",
  ...over,
});
const text = () => (document.body.textContent ?? "").replace(/ /g, " ");

beforeEach(() => {
  getBooking.mockReset();
  getBusiness.mockReset();
  getBusiness.mockResolvedValue(business);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Halaman hasil — kartu: reservasi terbukti ada", () => {
  it("menampilkan rincian dari data server: kode, jadwal, durasi, layanan, harga, anabul, pemilik, lokasi", () => {
    render(<BookingConfirmationCard booking={booking()} token="tok" business={business} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Terima Kasih atas Reservasi Anda!");
    expect(screen.getByText("Reservasi Berhasil Dibuat")).toBeDefined();
    expect(screen.getByText("GRM-20261024-ABCD")).toBeDefined();
    expect(screen.getByText("Sabtu, 24 Oktober 2026")).toBeDefined();
    expect(screen.getByText("09.00 WIB (60 Menit)", { exact: false })).toBeDefined();
    expect(screen.getByText("Basic Cat Grooming")).toBeDefined();
    expect(text()).toContain("Rp 85.000");
    expect(screen.getByText("Milo (Kucing)")).toBeDefined();
    expect(screen.getByText("Sarah Wijaya (081234567890)")).toBeDefined();
    expect(screen.getByText(/Jl\. Boulevard Barat Raya No\. 88/)).toBeDefined();
    expect(screen.getByRole("link", { name: /Buka Petunjuk Arah di Google Maps/i }).getAttribute("href")).toBe(business.googleMapsUrl);
  });

  it("status nyata ditampilkan: PENDING = Menunggu Konfirmasi, CONFIRMED = Terkonfirmasi", () => {
    const { unmount } = render(<BookingConfirmationCard booking={booking({ status: "PENDING" as never })} token="t" business={business} />);
    expect(screen.getByLabelText("Status reservasi: Menunggu Konfirmasi")).toBeDefined();
    expect(screen.getByText("Reservasi Anda menunggu konfirmasi dari salon.")).toBeDefined();
    unmount();
    render(<BookingConfirmationCard booking={booking({ status: "CONFIRMED" as never })} token="t" business={business} />);
    expect(screen.getByLabelText("Status reservasi: Terkonfirmasi")).toBeDefined();
    expect(screen.getByText("Reservasi Anda sudah terkonfirmasi.")).toBeDefined();
    expect(screen.queryByText(/menunggu konfirmasi/i)).toBeNull();
  });

  it.each([
    ["CANCELLED", "Dibatalkan"],
    ["COMPLETED", "Selesai"],
    ["NO_SHOW", "Tidak Hadir"],
    ["CHECKED_IN", "Check-in"],
    ["IN_PROGRESS", "Sedang Dikerjakan"],
  ])("status %s tidak dirayakan sebagai 'berhasil dibuat'", (status, label) => {
    render(<BookingConfirmationCard booking={booking({ status: status as never })} token="t" business={business} />);
    expect(screen.queryByText("Reservasi Berhasil Dibuat")).toBeNull();
    expect(screen.queryByText(/Terima Kasih atas Reservasi/)).toBeNull();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Detail Reservasi Anda");
    expect(screen.getByText(`Status Reservasi: ${label}`)).toBeDefined();
  });

  it("selalu memakai kode dari reservasi yang dibaca server, bukan kode dari URL", () => {
    render(<BookingConfirmationCard booking={booking()} bookingCode="PALSU-123" token="t" business={business} />);
    expect(screen.getByText("GRM-20261024-ABCD")).toBeDefined();
    expect(text()).not.toContain("PALSU-123");
  });

  it("tidak menjanjikan fitur yang tidak ada (penyesuaian jadwal mandiri)", () => {
    render(<BookingConfirmationCard booking={booking()} token="t" business={business} />);
    expect(text()).not.toMatch(/penyesuaian jadwal/i);
    expect(screen.getByRole("heading", { name: /Simpan Tautan Reservasi Anda/i })).toBeDefined();
  });

  it("tautan kelola, WhatsApp (memuat kode booking), dan Beranda mengarah ke tujuan yang benar", () => {
    render(<BookingConfirmationCard booking={booking()} token="a b" business={business} />);
    expect(screen.getByRole("link", { name: /Buka Halaman Kelola Reservasi/i }).getAttribute("href")).toBe("/booking/manage?token=a%20b");
    const wa = screen.getByRole("link", { name: /Hubungi Salon via WhatsApp/i }).getAttribute("href")!;
    expect(wa).toContain("https://wa.me/6281234567890");
    expect(decodeURIComponent(wa)).toContain("GRM-20261024-ABCD");
    expect(screen.getByRole("link", { name: "Kembali ke Beranda" }).getAttribute("href")).toBe("/");
  });

  it("tanpa token: tidak ada bagian tautan kelola; tanpa nomor WhatsApp: tidak ada tombol WhatsApp", () => {
    render(<BookingConfirmationCard booking={booking()} business={{ ...business, whatsapp: null, phone: null } as PublicBusinessProfile} />);
    expect(screen.queryByRole("heading", { name: /Simpan Tautan Reservasi/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /WhatsApp/i })).toBeNull();
  });
});

describe("Halaman hasil — kartu: tidak ada bukti reservasi → tidak boleh tampil 'berhasil'", () => {
  const forbidden = () => {
    expect(screen.queryByText("Reservasi Berhasil Dibuat")).toBeNull();
    expect(screen.queryByText(/Terima Kasih atas Reservasi/)).toBeNull();
    expect(screen.queryByText(/Kode Booking Resmi/i)).toBeNull();
    expect(text()).not.toContain("GRM-JADWAL");
    expect(screen.queryByRole("link", { name: /Buka Halaman Kelola/i })).toBeNull();
  };

  it("token salah/kedaluwarsa → 'Reservasi Tidak Ditemukan' + jalan keluar", () => {
    render(<BookingConfirmationCard booking={null} bookingCode="GRM-X" token="salah" business={business} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Reservasi Tidak Ditemukan");
    expect(text()).toMatch(/tidak valid, sudah dicabut, atau sudah kedaluwarsa/);
    forbidden();
    expect(text()).not.toContain("GRM-X");
    expect(screen.getByRole("link", { name: "Buat Reservasi Baru" }).getAttribute("href")).toBe("/booking");
    expect(screen.getByRole("link", { name: /Bantuan WhatsApp/i }).getAttribute("href")).toContain("wa.me/6281234567890");
  });

  it("tanpa token → pesan 'tautan tidak lengkap'", () => {
    render(<BookingConfirmationCard booking={null} business={business} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Reservasi Tidak Ditemukan");
    expect(text()).toMatch(/Tautan ini tidak lengkap/);
    forbidden();
  });

  it("gangguan memuat → 'belum dapat dimuat' + Muat Ulang + peringatan agar tidak memesan ganda", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    render(<BookingConfirmationCard booking={null} token="tok" business={business} loadFailed />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Detail Reservasi Belum Dapat Dimuat");
    expect(text()).toMatch(/sebelum membuat reservasi baru agar tidak terjadi pemesanan ganda/);
    forbidden();
    expect(screen.queryByRole("link", { name: "Buat Reservasi Baru" })).toBeNull(); // jangan dorong pemesanan ulang
    fireEvent.click(screen.getByRole("button", { name: /Muat Ulang/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("tanpa nomor WhatsApp: tombol bantuan tidak ditampilkan", () => {
    render(<BookingConfirmationCard booking={null} token="x" business={{ ...business, whatsapp: null, phone: null } as PublicBusinessProfile} />);
    expect(screen.queryByRole("link", { name: /Bantuan WhatsApp/i })).toBeNull();
  });
});

describe("Halaman hasil — tombol salin", () => {
  it("menyalin kode booking dan tautan kelola; label berubah menjadi 'Tersalin' dan diumumkan", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    render(<BookingConfirmationCard booking={booking()} token="tok 1" business={business} />);

    fireEvent.click(screen.getByRole("button", { name: /Salin kode booking/i }));
    await waitFor(() => expect(screen.getByText("Tersalin")).toBeDefined());
    expect(writeText).toHaveBeenLastCalledWith("GRM-20261024-ABCD");
    expect(screen.getByRole("status").textContent).toMatch(/Kode booking disalin/);

    fireEvent.click(screen.getByRole("button", { name: /Salin Link Reservasi/i }));
    await waitFor(() => expect(screen.getByText("Link Tersalin")).toBeDefined());
    expect(writeText).toHaveBeenLastCalledWith(`${window.location.origin}/booking/manage?token=tok%201`);
  });

  it("bila penyalinan gagal, label tidak berubah menjadi 'Tersalin'", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("ditolak"));
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    render(<BookingConfirmationCard booking={booking()} token="t" business={business} />);
    fireEvent.click(screen.getByRole("button", { name: /Salin kode booking/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.queryByText("Tersalin")).toBeNull();
  });
});

describe("Halaman hasil — halaman server (/booking/confirmation)", () => {
  const renderPage = async (params: { code?: string; token?: string }) => {
    render(await BookingConfirmationPage({ searchParams: Promise.resolve(params) }));
  };

  it("token valid: membaca reservasi dari server dan menampilkannya", async () => {
    getBooking.mockResolvedValue(booking({ status: "CONFIRMED" as never }));
    await renderPage({ code: "GRM-20261024-ABCD", token: "tok-valid" });
    expect(getBooking).toHaveBeenCalledWith("tok-valid");
    expect(screen.getByText("Reservasi Berhasil Dibuat")).toBeDefined();
    expect(screen.getByLabelText("Status reservasi: Terkonfirmasi")).toBeDefined();
  });

  it("tanpa parameter sama sekali: tidak memanggil server, TIDAK menampilkan berhasil dan tidak ada kode palsu", async () => {
    await renderPage({});
    expect(getBooking).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Reservasi Tidak Ditemukan");
    expect(text()).not.toContain("GRM-JADWAL");
    expect(screen.queryByText("Reservasi Berhasil Dibuat")).toBeNull();
  });

  it("hanya ada kode di URL tanpa token: tidak dianggap bukti", async () => {
    await renderPage({ code: "GRM-20261024-ABCD" });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Reservasi Tidak Ditemukan");
    expect(text()).not.toContain("GRM-20261024-ABCD");
  });

  it("token ditolak server (TokenAuthError): 'tidak ditemukan', kode dari URL tidak ditampilkan", async () => {
    getBooking.mockRejectedValue(new TokenAuthError("Token akses tidak valid atau tidak ditemukan.", 404, "NOT_FOUND"));
    await renderPage({ code: "GRM-PALSU-1", token: "salah" });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Reservasi Tidak Ditemukan");
    expect(text()).not.toContain("GRM-PALSU-1");
    expect(screen.queryByText("Reservasi Berhasil Dibuat")).toBeNull();
  });

  it("gangguan lain (mis. database): 'belum dapat dimuat', bukan 'berhasil' maupun 'tidak ditemukan'", async () => {
    getBooking.mockRejectedValue(new Error("koneksi database putus"));
    await renderPage({ code: "GRM-20261024-ABCD", token: "tok" });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Detail Reservasi Belum Dapat Dimuat");
    expect(screen.queryByText("Reservasi Berhasil Dibuat")).toBeNull();
    expect(screen.getByRole("button", { name: /Muat Ulang/i })).toBeDefined();
  });

  it("memuat ulang halaman (render ulang dengan tautan yang sama) menghasilkan rincian yang sama", async () => {
    getBooking.mockResolvedValue(booking());
    await renderPage({ code: "GRM-20261024-ABCD", token: "tok-valid" });
    const first = text();
    cleanup();
    await renderPage({ code: "GRM-20261024-ABCD", token: "tok-valid" });
    expect(text()).toBe(first);
    expect(getBooking).toHaveBeenCalledTimes(2); // dibaca dari server setiap kali, bukan dari state
  });

  it("halaman tidak boleh diindeks mesin pencari (memuat data pribadi)", async () => {
    const meta = await generateMetadata();
    const robots = meta.robots as { index?: boolean } | string | undefined;
    expect(typeof robots === "object" ? robots?.index : robots).toSatisfy((v: unknown) => v === false || /noindex/.test(String(v)));
  });
});
