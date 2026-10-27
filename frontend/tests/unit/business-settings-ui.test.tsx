// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BusinessProfileForm } from "@/components/dashboard/BusinessProfileForm";
import { OperatingHoursForm } from "@/components/dashboard/OperatingHoursForm";
import { BookingSettingsForm } from "@/components/dashboard/BookingSettingsForm";
import * as businessClient from "@/lib/business-client";
import { AuthenticatedUser } from "@backend/modules/auth/types";

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => "/dashboard/settings/business",
}));

const mockOwner: AuthenticatedUser = {
  id: "user-owner-1",
  name: "Budi Pratama",
  email: "budi@pawcare.id",
  role: "OWNER",
  tokenVersion: 1,
  isActive: true,
  lastLoginAt: new Date("2026-10-23T05:00:00Z"),
  passwordChangedAt: null,
};

const mockAdmin: AuthenticatedUser = {
  id: "user-admin-2",
  name: "Siti Rahma",
  email: "siti@pawcare.id",
  role: "ADMIN",
  tokenVersion: 1,
  isActive: true,
  lastLoginAt: new Date("2026-10-23T04:30:00Z"),
  passwordChangedAt: null,
};

const mockBusiness: businessClient.BusinessProfile = {
  id: "biz-1",
  name: "PawCare Grooming Studio",
  slug: "pawcare-grooming",
  description: "Layanan salon dan grooming profesional untuk anjing dan kucing.",
  email: "halo@pawcare.id",
  phone: "0217654321",
  whatsapp: "081298765432",
  address: "Jl. Senopati No. 45",
  fullAddress: "Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan",
  city: "Jakarta Selatan",
  province: "DKI Jakarta",
  postalCode: "12190",
  googleMapsUrl: "https://maps.google.com/?q=-6.2300,106.8000",
  timezone: "Asia/Jakarta",
  logoObjectKey: "business/logos/logo-sample.webp",
  status: "ACTIVE",
  isActive: true,
  createdAt: "2026-10-20T00:00:00Z",
  updatedAt: "2026-10-23T00:00:00Z",
};

const mockHours: businessClient.OperatingHour[] = [
  {
    dayOfWeek: 1, // Senin
    isOpen: true,
    openTime: "09:00",
    closeTime: "18:00",
    breaks: [{ startTime: "12:00", endTime: "13:00" }],
  },
  {
    dayOfWeek: 0, // Minggu
    isOpen: false,
    openTime: "09:00",
    closeTime: "16:00",
    breaks: [],
  },
];

const mockBookingSettings: businessClient.BookingSettings = {
  id: "settings-1",
  businessId: "biz-1",
  bookingEnabled: true,
  currency: "IDR",
  bookingIntervalMinutes: 30,
  defaultBufferMinutes: 15,
  minimumAdvanceMinutes: 60,
  maximumAdvanceDays: 30,
  cancellationWindowHours: 24,
  autoConfirmBooking: false,
  allowCustomerReschedule: true,
  createdAt: "2026-10-20T00:00:00Z",
  updatedAt: "2026-10-23T00:00:00Z",
};

describe("BusinessProfileForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender form profil bisnis lengkap dengan nilai awal", () => {
    render(<BusinessProfileForm business={mockBusiness} user={mockOwner} />);

    expect(screen.getByDisplayValue("PawCare Grooming Studio")).toBeDefined();
    expect(screen.getByDisplayValue("pawcare-grooming")).toBeDefined();
    expect(screen.getByDisplayValue("081298765432")).toBeDefined();
    expect(screen.getByDisplayValue("Jakarta Selatan")).toBeDefined();
    expect(screen.getByRole("button", { name: /Simpan Profil Bisnis/i })).toBeDefined();
  });

  it("menampilkan alert read-only dan menonaktifkan tombol simpan untuk role ADMIN", () => {
    render(<BusinessProfileForm business={mockBusiness} user={mockAdmin} />);

    expect(screen.getByText("Akses Lihat Saja (Read-Only)")).toBeDefined();
    expect(screen.queryByRole("button", { name: /Simpan Profil Bisnis/i })).toBeNull();
  });

  it("mengirim data perubahan profil bisnis saat disubmit oleh OWNER", async () => {
    const updateSpy = vi
      .spyOn(businessClient, "updateBusinessProfileApi")
      .mockResolvedValueOnce({
        success: true,
        data: { ...mockBusiness, name: "PawCare Premium Pet Studio" },
      });

    render(<BusinessProfileForm business={mockBusiness} user={mockOwner} />);

    const nameInput = screen.getByLabelText(/Nama Bisnis \/ Toko/i);
    fireEvent.change(nameInput, { target: { value: "PawCare Premium Pet Studio" } });

    const submitBtn = screen.getByRole("button", { name: /Simpan Profil Bisnis/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalled();
    });
  });
});

describe("OperatingHoursForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender daftar jam operasional mingguan dan tombol buka-tutup", () => {
    render(<OperatingHoursForm initialHours={mockHours} user={mockOwner} />);

    expect(screen.getByText("Jam Operasional & Istirahat")).toBeDefined();
    expect(screen.getByText("Senin")).toBeDefined();
    expect(screen.getByText("Minggu")).toBeDefined();
    expect(screen.getByRole("button", { name: /Simpan Seluruh Jadwal/i })).toBeDefined();
  });

  it("dapat menambah dan menghapus slot waktu istirahat pada hari buka", async () => {
    render(<OperatingHoursForm initialHours={mockHours} user={mockOwner} />);

    const addBreakButtons = screen.getAllByRole("button", { name: /Tambah Istirahat/i });
    expect(addBreakButtons.length).toBeGreaterThan(0);
    fireEvent.click(addBreakButtons[0]);

    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle("Hapus Waktu Istirahat");
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  it("menolak submit jika jam buka melebihi jam tutup", async () => {
    render(<OperatingHoursForm initialHours={mockHours} user={mockOwner} />);

    const inputs = screen.getAllByDisplayValue("09:00");
    // Ubah jam buka Senin menjadi 20:00 (lebih dari tutup 18:00)
    fireEvent.change(inputs[0], { target: { value: "20:00" } });

    const submitBtn = screen.getByRole("button", { name: /Simpan Seluruh Jadwal/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/harus lebih awal dari jam tutup/i)
      ).toBeDefined();
    });
  });
});

describe("BookingSettingsForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender parameter reservasi dan switch konfigurasi", () => {
    render(
      <BookingSettingsForm settings={mockBookingSettings} user={mockOwner} />
    );

    expect(screen.getByText("Pengaturan Reservasi (Booking)")).toBeDefined();
    expect(screen.getByLabelText(/Pemesanan Minimum Sebelumnya/i)).toBeDefined();
    expect(screen.getByLabelText(/Maksimum Reservasi ke Depan/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Simpan Konfigurasi Reservasi/i })).toBeDefined();
  });

  it("memperbarui konfigurasi saat disimpan oleh OWNER", async () => {
    const updateSpy = vi
      .spyOn(businessClient, "updateBookingSettingsApi")
      .mockResolvedValueOnce({
        success: true,
        data: { ...mockBookingSettings, maximumAdvanceDays: 60 },
      });

    render(
      <BookingSettingsForm settings={mockBookingSettings} user={mockOwner} />
    );

    const maxDaysInput = screen.getByLabelText(/Maksimum Reservasi ke Depan/i);
    fireEvent.change(maxDaysInput, { target: { value: "60" } });

    const submitBtn = screen.getByRole("button", { name: /Simpan Konfigurasi Reservasi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalled();
    });
  });
});
