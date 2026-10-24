// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BookingStatus } from "@prisma/client";
import {
  BookingStatusBadge,
  BookingSourceBadge,
} from "@/components/dashboard/bookings/BookingStatusBadge";
import { RescheduleModal } from "@/components/dashboard/bookings/RescheduleModal";
import { CancelModal } from "@/components/dashboard/bookings/CancelModal";
import { StatusTransitionModal } from "@/components/dashboard/bookings/StatusTransitionModal";
import { InternalNotesForm } from "@/components/dashboard/bookings/InternalNotesForm";
import { WalkInBookingForm } from "@/components/dashboard/bookings/WalkInBookingForm";

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => "/dashboard/bookings",
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("BookingStatusBadge & BookingSourceBadge Components", () => {
  it("merender label status bahasa Indonesia dengan tepat", () => {
    const { rerender } = render(
      <BookingStatusBadge status={BookingStatus.PENDING} />
    );
    expect(screen.getByText("Menunggu")).toBeDefined();

    rerender(<BookingStatusBadge status={BookingStatus.CONFIRMED} />);
    expect(screen.getByText("Dikonfirmasi")).toBeDefined();

    rerender(<BookingStatusBadge status={BookingStatus.CHECKED_IN} />);
    expect(screen.getByText("Check-in")).toBeDefined();

    rerender(<BookingStatusBadge status={BookingStatus.IN_PROGRESS} />);
    expect(screen.getByText("Sedang Dikerjakan")).toBeDefined();

    rerender(<BookingStatusBadge status={BookingStatus.COMPLETED} />);
    expect(screen.getByText("Selesai")).toBeDefined();

    rerender(<BookingStatusBadge status={BookingStatus.CANCELLED} />);
    expect(screen.getByText("Dibatalkan")).toBeDefined();

    rerender(<BookingStatusBadge status={BookingStatus.NO_SHOW} />);
    expect(screen.getByText("Tidak Hadir")).toBeDefined();
  });

  it("merender label source booking dengan tepat", () => {
    const { rerender } = render(<BookingSourceBadge source="WALK_IN" />);
    expect(screen.getByText("Walk-in")).toBeDefined();

    rerender(<BookingSourceBadge source="ADMIN" />);
    expect(screen.getByText("Admin")).toBeDefined();

    rerender(<BookingSourceBadge source="ONLINE" />);
    expect(screen.getByText("Online")).toBeDefined();
  });
});

describe("CancelModal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender dialog pembatalan dan memvalidasi alasan", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <CancelModal
        isOpen={true}
        onClose={onClose}
        bookingId="booking-123"
        bookingCode="PK-123"
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText("Batalkan Reservasi")).toBeDefined();
    expect(screen.getByText(/Tindakan ini akan membatalkan reservasi #PK-123/)).toBeDefined();

    const textarea = screen.getByPlaceholderText(/Contoh: Pelanggan tidak dapat hadir/);
    const submitBtn = screen.getByRole("button", { name: /Konfirmasi Batalkan/ });

    // Saat kosong, tombol disabled
    expect(submitBtn.hasAttribute("disabled")).toBe(true);

    // Isi alasan
    fireEvent.change(textarea, { target: { value: "Pelanggan minta dibatalkan" } });
    expect(submitBtn.hasAttribute("disabled")).toBe(false);

    // Mock fetch cancel success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/admin/bookings/booking-123/cancel",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ reason: "Pelanggan minta dibatalkan" }),
        })
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe("StatusTransitionModal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender perubahan status dan mengirim request PATCH", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <StatusTransitionModal
        isOpen={true}
        onClose={onClose}
        bookingId="booking-456"
        bookingCode="PK-456"
        currentStatus={BookingStatus.CONFIRMED}
        targetStatus={BookingStatus.CHECKED_IN}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText("Perbarui Status Reservasi")).toBeDefined();
    expect(screen.getByText("Check-in")).toBeDefined();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const submitBtn = screen.getByRole("button", { name: /Ubah Status ke Check-in/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/admin/bookings/booking-456/status",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: BookingStatus.CHECKED_IN }),
        })
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe("InternalNotesForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mengizinkan pengeditan dan penyimpanan catatan internal", async () => {
    const onNotesSaved = vi.fn();

    render(
      <InternalNotesForm
        bookingId="booking-789"
        initialNotes="Catatan awal"
        onNotesSaved={onNotesSaved}
      />
    );

    const textarea = screen.getByPlaceholderText(/Catatan khusus operasional/);
    expect(textarea).toBeDefined();
    expect((textarea as HTMLTextAreaElement).value).toBe("Catatan awal");

    fireEvent.change(textarea, { target: { value: "Catatan baru anabul sensitif" } });

    expect(screen.getByText("Ada perubahan belum disimpan")).toBeDefined();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const saveBtn = screen.getByRole("button", { name: /Simpan Catatan/ });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/admin/bookings/booking-789",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ internalNotes: "Catatan baru anabul sensitif" }),
        })
      );
      expect(onNotesSaved).toHaveBeenCalledWith("Catatan baru anabul sensitif");
    });
  });
});

describe("RescheduleModal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("memuat slot ketersediaan dan mengirimkan permintaan reschedule", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    // Mock availability slots
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          slots: [
            { time: "10:00", available: true },
            { time: "11:00", available: false, reason: "BOOKED" },
          ],
        },
      }),
    });

    render(
      <RescheduleModal
        isOpen={true}
        onClose={onClose}
        bookingId="booking-resched"
        bookingCode="PK-RESCHED"
        serviceId="svc-1"
        serviceName="Basic Grooming"
        currentDate="2026-10-23"
        currentTime="09:00"
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText("Ubah Jadwal Reservasi")).toBeDefined();

    // Tunggu slot 10:00 muncul
    await waitFor(() => {
      expect(screen.getByText("10:00")).toBeDefined();
    });

    // Pilih slot 10:00
    fireEvent.click(screen.getByText("10:00"));

    // Isi alasan
    const reasonInput = screen.getByLabelText(/Alasan Perubahan Jadwal/);
    fireEvent.change(reasonInput, { target: { value: "Pelanggan terlambat" } });

    // Mock reschedule POST
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const submitBtn = screen.getByRole("button", { name: /Simpan Perubahan Jadwal/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/admin/bookings/booking-resched/reschedule",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            date: "2026-10-23",
            time: "10:00",
            reason: "Pelanggan terlambat",
          }),
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});

describe("WalkInBookingForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender wizard form dan mengelola input pelanggan & anabul", async () => {
    // Mock availability slots
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          slots: [{ time: "14:00", available: true }],
        },
      }),
    });

    const mockServices = [
      {
        id: "svc-bath",
        name: "Bath & Blowdry",
        durationMinutes: 45,
        price: 85000,
      },
    ];

    render(
      <WalkInBookingForm services={mockServices} defaultDate="2026-10-24" />
    );

    expect(screen.getByText("1. Pilih Layanan & Waktu")).toBeDefined();
    expect(screen.getByText("2. Data Pemilik / Pelanggan")).toBeDefined();
    expect(screen.getByText("3. Profil Anabul")).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("14:00")).toBeDefined();
    });

    fireEvent.click(screen.getByText("14:00"));

    fireEvent.change(screen.getByLabelText(/Nama Lengkap/), {
      target: { value: "Ahmad Dani" },
    });
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp/), {
      target: { value: "081298765432" },
    });
    fireEvent.change(screen.getByLabelText(/Nama Anabul/), {
      target: { value: "Chiko" },
    });

    // Mock create walk-in booking POST
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          booking: { id: "new-walkin-id", bookingCode: "PK-WALKIN" },
        },
      }),
    });

    const submitBtn = screen.getByRole("button", { name: /Buat Reservasi Walk-in/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/admin/bookings",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Ahmad Dani"),
        })
      );
      expect(mockPush).toHaveBeenCalledWith("/dashboard/bookings/new-walkin-id");
    });
  });
});
