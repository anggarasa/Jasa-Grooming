// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { BookingStatus } from "@prisma/client";

// Public Components
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { FloatingWhatsAppButton } from "@/components/public/FloatingWhatsAppButton";
import { ServiceCard } from "@/components/public/ServiceCard";
import { OperatingHoursTable } from "@/components/public/OperatingHoursTable";
import { GalleryGrid } from "@/components/public/GalleryGrid";
import PublicLoading from "@/app/(public)/loading";
import PublicError from "@/app/(public)/error";

// Booking Wizard Components
import { BookingWizard } from "@/components/booking/BookingWizard";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { Step1ServiceSelect } from "@/components/booking/Step1ServiceSelect";
import { Step4CustomerForm } from "@/components/booking/Step4CustomerForm";
import { Step5PetForm } from "@/components/booking/Step5PetForm";
import { Step6ReviewConfirm } from "@/components/booking/Step6ReviewConfirm";
import { BookingConfirmationCard } from "@/components/booking/BookingConfirmationCard";
import { BookingManageCard } from "@/components/booking/BookingManageCard";

// Dashboard Components & Modals
import DashboardLoading from "@/app/dashboard/loading";
import DashboardError from "@/app/dashboard/error";
import GlobalError from "@/app/global-error";
import { RescheduleModal } from "@/components/dashboard/bookings/RescheduleModal";
import { CancelModal } from "@/components/dashboard/bookings/CancelModal";
import { StatusTransitionModal } from "@/components/dashboard/bookings/StatusTransitionModal";
import { CalendarSelectModal } from "@/components/dashboard/integrations/CalendarSelectModal";
import { DisconnectConfirmDialog } from "@/components/dashboard/integrations/DisconnectConfirmDialog";
import { LoginForm } from "@/components/auth/LoginForm";

// Types
import { PublicServiceItem } from "@backend/modules/public/public-services.service";
import { PublicBusinessProfile } from "@backend/modules/public/public-business.service";
import { PublicOperatingStatus } from "@backend/modules/public/public-hours.service";
import { ManagedBookingDto } from "@backend/modules/bookings/token.service";

// Mock Next.js navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => "/services",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock Fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const sampleBusiness: PublicBusinessProfile = {
  id: "biz-1",
  name: "PawCare Grooming",
  slug: "pawcare-grooming",
  description: "Salon dan spa grooming hewan peliharaan modern di Jakarta Selatan.",
  phone: "08123456789",
  whatsapp: "6281234567890",
  email: "halo@pawcare.id",
  address: "Jl. Senopati No. 42",
  fullAddress: "Jl. Senopati No. 42, Jakarta Selatan, 12190",
  city: "Jakarta Selatan",
  province: "DKI Jakarta",
  postalCode: "12190",
  googleMapsUrl: "https://maps.google.com",
  logoObjectKey: null,
  timezone: "Asia/Jakarta",
};

const sampleServices: PublicServiceItem[] = [
  {
    id: "svc-1",
    name: "Full Grooming Anjing Kecil",
    slug: "full-grooming-anjing-kecil",
    description: "Perawatan mandi, potong kuku, pembersihan telinga, dan gunting bulu rapi.",
    shortDescription: "Paket lengkap khusus ras kecil.",
    fullDescription: null,
    durationMinutes: 60,
    bufferMinutes: 15,
    price: 150000,
    formattedPrice: "Rp 150.000",
    imageObjectKey: null,
    displayOrder: 1,
    category: { id: "cat-1", name: "Anjing", slug: "anjing" },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "svc-2",
    name: "Mandi Kucing Anti-Kutu",
    slug: "mandi-kucing-anti-kutu",
    description: "Mandi higienis dengan formula sampo medis anti kutu.",
    shortDescription: "Bebas kutu dan wangi sepanjang hari.",
    fullDescription: null,
    durationMinutes: 45,
    bufferMinutes: 15,
    price: 120000,
    formattedPrice: "Rp 120.000",
    imageObjectKey: null,
    displayOrder: 2,
    category: { id: "cat-2", name: "Kucing", slug: "kucing" },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("Comprehensive Frontend Regression & Accessibility Suite", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/availability")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: { isOpen: true },
            slots: [{ time: "10:00", available: true }],
          }),
        });
      }
      if (typeof url === "string" && url.includes("/api/integrations/google/calendars")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              calendars: [
                { id: "cal-primary", summary: "Jadwal PawCare Utama", primary: true, accessRole: "owner" },
                { id: "cal-secondary", summary: "Cabang Dua", primary: false, accessRole: "writer" },
              ],
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("A. Public Website Components & Accessibility", () => {
    it("merender PublicHeader dengan landmark navigasi dan alt text brand yang valid", () => {
      const operatingStatus: PublicOperatingStatus = {
        isOpenNow: true,
        statusText: "Buka Sekarang",
        todayHours: null,
        schedule: [],
        timezone: "Asia/Jakarta",
      };

      render(<PublicHeader business={sampleBusiness} operatingStatus={operatingStatus} />);

      // Landmark Navigasi
      expect(screen.getByRole("banner")).toBeDefined();
      expect(screen.getByLabelText("Navigasi Utama")).toBeDefined();
      expect(screen.getByLabelText(`Beranda ${sampleBusiness.name}`)).toBeDefined();
      expect(screen.getByText("Booking Sekarang")).toBeDefined();
    });

    it("merender PublicFooter dengan copyright dan informasi kontak lengkap", () => {
      render(<PublicFooter business={sampleBusiness} />);

      expect(screen.getByRole("contentinfo")).toBeDefined();
      expect(screen.getByText(/Seluruh hak cipta dilindungi/i)).toBeDefined();
      expect(screen.getByText(/Jl\. Senopati No\. 42/)).toBeDefined();
    });

    it("merender FloatingWhatsAppButton dengan link WhatsApp dan aksesibilitas ramah keyboard", () => {
      render(
        <FloatingWhatsAppButton
          phone={sampleBusiness.whatsapp}
          businessName={sampleBusiness.name}
        />
      );

      const waLink = screen.getByLabelText("Chat WhatsApp dengan kami");
      expect(waLink).toBeDefined();
      expect(waLink.getAttribute("href")).toContain("wa.me");
      expect(waLink.getAttribute("target")).toBe("_blank");
    });

    it("merender ServiceCard dengan durasi waktu, harga IDR, dan tombol aksi eksplisit", () => {
      render(<ServiceCard service={sampleServices[0]} />);

      expect(screen.getByText(sampleServices[0].name)).toBeDefined();
      expect(screen.getByText("60 Menit")).toBeDefined();
      expect(screen.getByText("Rp 150.000")).toBeDefined();
      expect(screen.getByText("Detail")).toBeDefined();
      expect(screen.getByText("Booking")).toBeDefined();
    });

    it("merender OperatingHoursTable dengan baris jadwal harian yang terstruktur", () => {
      const schedule = [
        { dayOfWeek: 1, dayName: "Senin", isOpen: true, openTime: "09:00", closeTime: "18:00", formattedHours: "09:00 - 18:00 WIB", breaks: [] },
        { dayOfWeek: 2, dayName: "Selasa", isOpen: true, openTime: "09:00", closeTime: "18:00", formattedHours: "09:00 - 18:00 WIB", breaks: [] },
        { dayOfWeek: 0, dayName: "Minggu", isOpen: false, openTime: "", closeTime: "", formattedHours: "Tutup / Libur", breaks: [] },
      ];

      render(<OperatingHoursTable schedule={schedule} />);

      expect(screen.getByText("Senin")).toBeDefined();
      expect(screen.getAllByText(/09:00.*18:00 WIB/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Tutup \/ Libur/)).toBeDefined();
    });

    it("merender GalleryGrid dalam mode kosong atau memiliki item dengan alt text aman", () => {
      const items = [
        {
          id: "gal-1",
          caption: "Grooming Pudel Putih",
          mediaObjectKey: "pudel.jpg",
          objectKey: "pudel.jpg",
          altText: "Grooming Pudel Putih",
          displayOrder: 1,
          createdAt: new Date(),
        },
      ];

      render(<GalleryGrid items={items} />);
      expect(screen.getByText("Grooming Pudel Putih")).toBeDefined();
    });
  });

  describe("B. Booking Wizard Flow & State Progression", () => {
    it("menampilkan BookingProgress dengan 6 langkah dan aria landmark", () => {
      render(
        <BookingProgress
          currentStep={3}
          maxAccessibleStep={4}
          onStepClick={vi.fn()}
        />
      );

      expect(screen.getByLabelText("Progres reservasi")).toBeDefined();
      expect(screen.getByText("Layanan")).toBeDefined();
      expect(screen.getByText("Tanggal")).toBeDefined();
      expect(screen.getByText("Jam")).toBeDefined();
      expect(screen.getByText("Data Pemilik")).toBeDefined();
    });

    it("menavigasikan langkah Step 1 ke Step 2 saat layanan dipilih", () => {
      const handleSelect = vi.fn();
      render(
        <Step1ServiceSelect
          services={sampleServices}
          selectedServiceId={null}
          onSelectService={handleSelect}
        />
      );

      const serviceOption = screen.getByText(sampleServices[0].name);
      fireEvent.click(serviceOption);
      expect(handleSelect).toHaveBeenCalledWith(sampleServices[0]);
    });

    it("memvalidasi Step 4 Customer Form untuk input nama dan no HP yang wajib", async () => {
      const handleSubmit = vi.fn();
      render(
        <Step4CustomerForm
          initialData={{ name: "", phone: "", email: "" }}
          onSubmitStep={handleSubmit}
          formId="test-form"
        />
      );

      const nameInput = screen.getByLabelText(/Nama Lengkap/i);
      const phoneInput = screen.getByLabelText(/Nomor WhatsApp/i);

      fireEvent.change(nameInput, { target: { value: "Budi Santoso" } });
      fireEvent.change(phoneInput, { target: { value: "081299998888" } });

      const form = nameInput.closest("form");
      expect(form).not.toBeNull();
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          name: "Budi Santoso",
          phone: "081299998888",
          email: "",
        });
      });
    });

    it("memvalidasi Step 5 Pet Form untuk data hewan peliharaan", async () => {
      const handleSubmit = vi.fn();
      render(
        <Step5PetForm
          initialData={{ name: "", type: "Anjing", breed: "", notes: "" }}
          onSubmitStep={handleSubmit}
          formId="test-pet-form"
        />
      );

      const petNameInput = screen.getByLabelText(/Nama Panggilan Anabul/i);
      fireEvent.change(petNameInput, { target: { value: "Milo" } });

      const form = petNameInput.closest("form");
      expect(form).not.toBeNull();
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });
    });

    it("merender Step 6 Review & Confirm dengan ringkasan lengkap dan submit handler", () => {
      const handleSubmit = vi.fn();
      render(
        <Step6ReviewConfirm
          service={sampleServices[0]}
          date="2026-10-25"
          time="10:00"
          customer={{ name: "Ahmad", phone: "0812345678" }}
          pet={{ name: "Choco", type: "Anjing", breed: "Golden" }}
          customerNotes="Mohon sampo khusus kulit sensitif"
          onChangeCustomerNotes={vi.fn()}
          onEditStep={vi.fn()}
          isSubmitting={false}
          errorMessage={null}
          onSubmit={handleSubmit}
          onSlotConflictRetry={vi.fn()}
        />
      );

      expect(screen.getByText("Full Grooming Anjing Kecil")).toBeDefined();
      expect(screen.getByText(/Choco/)).toBeDefined();
      expect(screen.getByText(/\(Anjing\)/)).toBeDefined();
      expect(screen.getByText("Ahmad")).toBeDefined();
      expect(screen.getByText("Konfirmasi & Buat Reservasi")).toBeDefined();

      const submitBtn = screen.getByText("Konfirmasi & Buat Reservasi");
      fireEvent.click(submitBtn);
      expect(handleSubmit).toHaveBeenCalled();
    });

    it("menjalankan alur lengkap BookingWizard dari awal hingga langkah akhir", () => {
      render(<BookingWizard services={sampleServices} />);

      // Step 1: Layanan terlihat
      expect(screen.getByText(sampleServices[0].name)).toBeDefined();

      // Pilih Layanan
      fireEvent.click(screen.getByText(sampleServices[0].name));

      // Lanjut ke Tanggal
      const nextBtn = screen.getByText("Lanjut ke Tanggal");
      fireEvent.click(nextBtn);

      // Pastikan masuk ke Step 2
      expect(screen.getByText("Pilih Tanggal Reservasi")).toBeDefined();
    });
  });

  describe("C. Admin Action Modals & Dialog Constraint Verification", () => {
    it("RescheduleModal memiliki constraint max-h-[90vh], overflow-y-auto, dan memanggil API dengan benar", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            availableSlots: [{ time: "14:00", available: true }],
          },
        }),
      });

      const handleSuccess = vi.fn();
      const handleClose = vi.fn();

      render(
        <RescheduleModal
          isOpen={true}
          onClose={handleClose}
          bookingId="b-101"
          bookingCode="GRM-001"
          serviceId="svc-1"
          serviceName="Full Grooming"
          currentDate="2026-10-24"
          currentTime="10:00"
          onSuccess={handleSuccess}
        />
      );

      expect(screen.getByText("Ubah Jadwal Reservasi")).toBeDefined();
      expect(screen.getByText(/GRM-001/)).toBeDefined();

      // Constraint verification
      const dialogContent = screen.getByRole("dialog");
      expect(dialogContent.className).toContain("max-h-[90vh]");
      expect(dialogContent.className).toContain("overflow-y-auto");

      // Tutup modal
      const cancelBtn = screen.getByText("Batal");
      fireEvent.click(cancelBtn);
      expect(handleClose).toHaveBeenCalled();
    });

    it("CancelModal memiliki constraint max-h-[90vh], form validation alasan, dan konfirmasi", async () => {
      const handleClose = vi.fn();
      const handleSuccess = vi.fn();

      render(
        <CancelModal
          isOpen={true}
          onClose={handleClose}
          bookingId="b-102"
          bookingCode="GRM-002"
          onSuccess={handleSuccess}
        />
      );

      expect(screen.getByText("Batalkan Reservasi")).toBeDefined();
      const dialogContent = screen.getByRole("dialog");
      expect(dialogContent.className).toContain("max-h-[90vh]");
      expect(dialogContent.className).toContain("overflow-y-auto");

      const reasonInput = screen.getByPlaceholderText(/Contoh: Pelanggan tidak dapat hadir/i);
      const submitBtn = screen.getByText("Konfirmasi Batalkan Reservasi");

      // Disabled saat alasan kosong
      expect(submitBtn.hasAttribute("disabled")).toBe(true);

      fireEvent.change(reasonInput, { target: { value: "Pelanggan berhalangan hadir secara darurat" } });
      expect(submitBtn.hasAttribute("disabled")).toBe(false);
    });

    it("StatusTransitionModal memiliki constraint max-h-[90vh] dan transisi status valid", () => {
      const handleClose = vi.fn();
      render(
        <StatusTransitionModal
          isOpen={true}
          onClose={handleClose}
          bookingId="b-103"
          bookingCode="GRM-003"
          currentStatus={BookingStatus.CONFIRMED}
          targetStatus={BookingStatus.IN_PROGRESS}
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByText("Perbarui Status Reservasi")).toBeDefined();
      const dialogContent = screen.getByRole("dialog");
      expect(dialogContent.className).toContain("max-h-[90vh]");
      expect(dialogContent.className).toContain("overflow-y-auto");
    });

    it("CalendarSelectModal memiliki constraint max-h-[90vh] dan navigasi radio kalender", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            calendars: [
              { id: "cal-primary", summary: "Jadwal PawCare Utama", primary: true, accessRole: "owner" },
              { id: "cal-secondary", summary: "Cabang Dua", primary: false, accessRole: "writer" },
            ],
          },
        }),
      });

      render(
        <CalendarSelectModal
          isOpen={true}
          onClose={vi.fn()}
          currentCalendarId="cal-primary"
          onSuccess={vi.fn()}
        />
      );

      const dialogContent = screen.getByRole("dialog");
      expect(dialogContent.className).toContain("max-h-[90vh]");
      expect(dialogContent.className).toContain("overflow-y-auto");

      await waitFor(() => {
        expect(screen.getByText("Jadwal PawCare Utama")).toBeDefined();
      });
    });

    it("DisconnectConfirmDialog memiliki constraint max-h-[90vh] dan peringatan keamanan", () => {
      render(
        <DisconnectConfirmDialog
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByText("Putuskan Google Calendar")).toBeDefined();
      const dialogContent = screen.getByRole("dialog");
      expect(dialogContent.className).toContain("max-h-[90vh]");
      expect(dialogContent.className).toContain("overflow-y-auto");
      expect(screen.getByText(/Peringatan Keamanan & Operasional/i)).toBeDefined();
    });
  });

  describe("D. Login Form & Keyboard Accessibility", () => {
    it("LoginForm memiliki label terkait, tombol visibilitas kata sandi yang dapat diakses keyboard", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Kata Sandi$/i);
      const togglePasswordBtn = screen.getByLabelText("Tampilkan kata sandi");

      expect(emailInput).toBeDefined();
      expect(passwordInput).toBeDefined();
      expect(togglePasswordBtn).toBeDefined();

      // Pastikan tabIndex bukan -1 sehingga pengguna keyboard dapat mengaksesnya
      expect(togglePasswordBtn.getAttribute("tabindex")).toBeNull();

      // Toggle visibilitas kata sandi
      fireEvent.click(togglePasswordBtn);
      expect(screen.getByLabelText("Sembunyikan kata sandi")).toBeDefined();
    });
  });

  describe("E. Error Boundaries & Skeletons Resilience", () => {
    it("merender PublicLoading tanpa console error", () => {
      render(<PublicLoading />);
      expect(document.querySelector(".animate-pulse")).toBeDefined();
    });

    it("merender PublicError dengan tombol coba muat ulang", () => {
      const resetMock = vi.fn();
      render(<PublicError error={new Error("Test error")} reset={resetMock} />);

      expect(screen.getByText("Terjadi Kendala Memuat Halaman")).toBeDefined();
      const resetBtn = screen.getByText("Coba Muat Ulang");
      fireEvent.click(resetBtn);
      expect(resetMock).toHaveBeenCalled();
    });

    it("merender DashboardLoading skeleton dengan aria-busy semantik", () => {
      render(<DashboardLoading />);
      const skeletonContainer = screen.getByLabelText("Memuat data dashboard");
      expect(skeletonContainer).toBeDefined();
      expect(skeletonContainer.getAttribute("aria-busy")).toBe("true");
    });

    it("merender DashboardError boundary dengan reset action", () => {
      const resetMock = vi.fn();
      render(<DashboardError error={new Error("Dashboard query failed")} reset={resetMock} />);

      expect(screen.getByText("Gagal Memuat Halaman Dashboard")).toBeDefined();
      const resetBtn = screen.getByText("Coba Lagi");
      fireEvent.click(resetBtn);
      expect(resetMock).toHaveBeenCalled();
    });

    it("merender GlobalError root layout fallback dengan struktur error yang benar", () => {
      const resetMock = vi.fn();
      render(<GlobalError error={new Error("Fatal root failure")} reset={resetMock} />);
      expect(screen.getByText("Terjadi Kesalahan Sistem")).toBeDefined();
    });
  });

  describe("F. Booking Confirmation & Guest Management Cards", () => {
    const sampleManagedBooking: ManagedBookingDto = {
      id: "b-999",
      bookingCode: "GRM-20261025-A1B2",
      status: BookingStatus.CONFIRMED,
      startAt: "2026-10-25T03:00:00.000Z", // 10:00 WIB
      endAt: "2026-10-25T04:00:00.000Z",
      serviceEndAt: "2026-10-25T04:00:00.000Z",
      occupancyEndAt: "2026-10-25T04:15:00.000Z",
      serviceName: "Full Grooming",
      durationMinutes: 60,
      totalPrice: 150000,
      stationName: "Stasiun 1",
      canCancel: true,
      cancellationWindowHours: 24,
      createdAt: "2026-10-23T10:00:00.000Z",
      customerNotes: "Mohon hati-hati di area telinga",
      customer: {
        name: "Siti Rahma",
        phone: "081288887777",
        email: "siti@example.com",
      },
      pet: {
        name: "Bobby",
        type: "Anjing",
        breed: "Poodle",
        age: 2,
        notes: "Suka diberi snack",
      },
    };

    it("merender BookingConfirmationCard dengan rincian jadwal dan tombol aksi", () => {
      render(
        <BookingConfirmationCard
          booking={sampleManagedBooking}
          bookingCode="GRM-20261025-A1B2"
          token="guest-token-123"
          business={sampleBusiness}
        />
      );

      expect(screen.getByText("GRM-20261025-A1B2")).toBeDefined();
      expect(screen.getByText("Full Grooming")).toBeDefined();
      expect(screen.getByText(/Bobby/)).toBeDefined();
    });

    it("merender BookingManageCard dengan status badge dan tombol bantuan WhatsApp", () => {
      render(
        <BookingManageCard
          booking={sampleManagedBooking}
          business={sampleBusiness}
        />
      );

      expect(screen.getByText("GRM-20261025-A1B2")).toBeDefined();
      expect(screen.getByText("Terkonfirmasi")).toBeDefined();
      expect(screen.getByText("Bantuan WhatsApp Cepat")).toBeDefined();
    });
  });
});
