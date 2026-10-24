// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { CalendarStatusBadge } from "@/components/dashboard/integrations/CalendarStatusBadge";
import { JobStatusBadge } from "@/components/dashboard/integrations/JobStatusBadge";
import {
  ConflictStatusBadge,
  ConflictTypeBadge,
} from "@/components/dashboard/integrations/ConflictStatusBadge";
import {
  GoogleIntegrationCard,
  GoogleIntegrationStatus,
} from "@/components/dashboard/integrations/GoogleIntegrationCard";
import { DisconnectConfirmDialog } from "@/components/dashboard/integrations/DisconnectConfirmDialog";
import { CalendarSelectModal } from "@/components/dashboard/integrations/CalendarSelectModal";
import { SyncJobsTable } from "@/components/dashboard/integrations/SyncJobsTable";
import { ConflictResolutionCard } from "@/components/dashboard/integrations/ConflictResolutionCard";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/dashboard/settings/integrations",
}));

// Mock Sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Google Calendar UI Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CalendarStatusBadge", () => {
    it("merender 6 status koneksi dengan badge semantik yang benar", () => {
      const { rerender } = render(<CalendarStatusBadge status="NOT_CONNECTED" />);
      expect(screen.getByText("Belum Terhubung")).toBeDefined();

      rerender(<CalendarStatusBadge status="CONNECTED" />);
      expect(screen.getByText("Terhubung")).toBeDefined();

      rerender(<CalendarStatusBadge status="SYNCING" />);
      expect(screen.getByText("Menyinkronkan")).toBeDefined();

      rerender(<CalendarStatusBadge status="DEGRADED" />);
      expect(screen.getByText("Sinkronisasi Terdegradasi")).toBeDefined();

      rerender(<CalendarStatusBadge status="REAUTH_REQUIRED" />);
      expect(screen.getByText("Perlu Autentikasi Ulang")).toBeDefined();

      rerender(<CalendarStatusBadge status="ERROR" />);
      expect(screen.getByText("Gagal / Terkendala")).toBeDefined();
    });
  });

  describe("JobStatusBadge & ConflictStatusBadge", () => {
    it("merender status outbox queue dengan benar", () => {
      const { rerender } = render(<JobStatusBadge status="PENDING" />);
      expect(screen.getByText("Menunggu Antrean")).toBeDefined();

      rerender(<JobStatusBadge status="PROCESSING" />);
      expect(screen.getByText("Sedang Diproses")).toBeDefined();

      rerender(<JobStatusBadge status="COMPLETED" />);
      expect(screen.getByText("Selesai")).toBeDefined();

      rerender(<JobStatusBadge status="FAILED" />);
      expect(screen.getByText("Gagal (Retrying)")).toBeDefined();

      rerender(<JobStatusBadge status="DEAD_LETTER" />);
      expect(screen.getByText("Gagal Permanen")).toBeDefined();
    });

    it("merender tipe dan status konflik dengan benar", () => {
      render(
        <div>
          <ConflictStatusBadge status="PENDING" />
          <ConflictTypeBadge type="REMOTE_DELETED" />
          <ConflictTypeBadge type="TIME_OVERLAP" />
        </div>
      );

      expect(screen.getByText("Perlu Resolusi")).toBeDefined();
      expect(screen.getByText("Dihapus di Google")).toBeDefined();
      expect(screen.getByText("Tumpang Tindih Jadwal")).toBeDefined();
    });
  });

  describe("GoogleIntegrationCard", () => {
    const mockNotConnectedStatus: GoogleIntegrationStatus = {
      isConfigured: true,
      isEnabled: true,
      status: "NOT_CONNECTED",
      isOwner: true,
      connectedAccount: null,
      selectedCalendar: null,
      lastSyncAt: null,
      metrics: {
        pendingJobs: 0,
        failedJobs: 0,
        pendingConflicts: 0,
      },
    };

    it("menampilkan ajakan menghubungkan Google Calendar saat belum terhubung", () => {
      render(
        <GoogleIntegrationCard
          statusData={mockNotConnectedStatus}
          onRefreshStatus={vi.fn()}
          onOpenCalendarSelect={vi.fn()}
          onOpenDisconnect={vi.fn()}
        />
      );

      expect(screen.getByText("Google Calendar Belum Terhubung")).toBeDefined();
      expect(
        screen.getByRole("button", { name: /Hubungkan Google Calendar/i })
      ).toBeDefined();
    });

    it("menonaktifkan tombol hubungkan jika bukan role OWNER", () => {
      const staffStatus: GoogleIntegrationStatus = {
        ...mockNotConnectedStatus,
        isOwner: false,
      };

      render(
        <GoogleIntegrationCard
          statusData={staffStatus}
          onRefreshStatus={vi.fn()}
          onOpenCalendarSelect={vi.fn()}
          onOpenDisconnect={vi.fn()}
        />
      );

      const connectBtn = screen.getByRole("button", { name: /Hubungkan Google Calendar/i });
      expect(connectBtn.hasAttribute("disabled")).toBe(true);
      expect(screen.getByText(/Hanya peran/i)).toBeDefined();
    });

    it("menampilkan detail akun dan kalender saat status CONNECTED", () => {
      const connectedStatus: GoogleIntegrationStatus = {
        isConfigured: true,
        isEnabled: true,
        status: "CONNECTED",
        isOwner: true,
        connectedAccount: "owner@pawcare.id",
        googleAccountEmail: "owner@pawcare.id",
        selectedCalendar: {
          id: "primary",
          name: "PawCare Grooming Calendar",
          timeZone: "Asia/Jakarta",
        },
        calendarName: "PawCare Grooming Calendar",
        calendarTimezone: "Asia/Jakarta",
        lastSyncAt: "2026-10-23T10:00:00.000Z",
        metrics: {
          pendingJobs: 2,
          failedJobs: 0,
          pendingConflicts: 1,
        },
      };

      const handleCalendarSelect = vi.fn();
      const handleDisconnect = vi.fn();

      render(
        <GoogleIntegrationCard
          statusData={connectedStatus}
          onRefreshStatus={vi.fn()}
          onOpenCalendarSelect={handleCalendarSelect}
          onOpenDisconnect={handleDisconnect}
        />
      );

      expect(screen.getByText("owner@pawcare.id")).toBeDefined();
      expect(screen.getByText("PawCare Grooming Calendar")).toBeDefined();
      expect(screen.getByText("Asia/Jakarta")).toBeDefined();

      const selectBtn = screen.getByRole("button", { name: /Ganti Kalender/i });
      fireEvent.click(selectBtn);
      expect(handleCalendarSelect).toHaveBeenCalled();

      const disconnectBtn = screen.getByRole("button", { name: /Putuskan Koneksi/i });
      fireEvent.click(disconnectBtn);
      expect(handleDisconnect).toHaveBeenCalled();
    });
  });

  describe("DisconnectConfirmDialog", () => {
    it("menampilkan peringatan eksplisit tentang booking tetap tersimpan saat disconnect", async () => {
      const handleClose = vi.fn();
      const handleSuccess = vi.fn();

      render(
        <DisconnectConfirmDialog
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      );

      expect(
        screen.getByText(
          "Memutuskan Google Calendar akan menghentikan sinkronisasi otomatis. Booking Anda tetap tersimpan di sistem."
        )
      ).toBeDefined();

      // Mock fetch API disconnect
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const confirmBtn = screen.getByRole("button", { name: /Ya, Putuskan Koneksi/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/integrations/google/disconnect",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ confirm: true }),
          })
        );
        expect(handleSuccess).toHaveBeenCalled();
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });

  describe("CalendarSelectModal", () => {
    it("memuat dan menampilkan daftar kalender yang dapat dipilih", async () => {
      const mockCalendars = [
        {
          id: "primary",
          summary: "Kalender Utama Pribadi",
          primary: true,
          timeZone: "Asia/Jakarta",
          accessRole: "owner",
        },
        {
          id: "pawcare-work@group.calendar.google.com",
          summary: "PawCare Salon Work",
          primary: false,
          timeZone: "Asia/Jakarta",
          accessRole: "writer",
        },
      ];

      global.fetch = vi.fn().mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/api/integrations/google/calendars")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                selectedCalendarId: "primary",
                calendars: mockCalendars,
              },
            }),
          });
        }
        if (typeof url === "string" && url.includes("/api/integrations/google/select-calendar")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      const handleClose = vi.fn();
      const handleSuccess = vi.fn();

      render(
        <CalendarSelectModal
          isOpen={true}
          onClose={handleClose}
          currentCalendarId="primary"
          onSuccess={handleSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Kalender Utama Pribadi")).toBeDefined();
        expect(screen.getByText("PawCare Salon Work")).toBeDefined();
      });

      // Pilih kalender kedua
      const secondCalBtn = screen.getByText("PawCare Salon Work").closest("button");
      expect(secondCalBtn).toBeDefined();
      if (secondCalBtn) {
        fireEvent.click(secondCalBtn);
      }

      const submitBtn = screen.getByRole("button", { name: /Gunakan Kalender Ini/i });
      expect(submitBtn.hasAttribute("disabled")).toBe(false);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/integrations/google/select-calendar",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ calendarId: "pawcare-work@group.calendar.google.com" }),
          })
        );
        expect(handleSuccess).toHaveBeenCalled();
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });

  describe("SyncJobsTable", () => {
    it("merender tabel outbox queue dan memicu retry pada job gagal", async () => {
      const mockJobs = [
        {
          id: "job-1",
          operationType: "CREATE",
          status: "FAILED",
          attemptCount: 2,
          maxAttempts: 5,
          createdAt: "2026-10-23T10:00:00.000Z",
          lastError: "Rate limit exceeded on Google API",
          booking: {
            id: "b-1",
            bookingCode: "GRM-20261023-0001",
            startAt: "2026-10-23T11:00:00.000Z",
            occupancyEndAt: "2026-10-23T12:00:00.000Z",
            status: "CONFIRMED",
          },
        },
      ];

      const handleRetry = vi.fn().mockResolvedValue(undefined);

      render(
        <SyncJobsTable
          jobs={mockJobs}
          isLoading={false}
          meta={{ total: 1, page: 1, limit: 20, totalPages: 1 }}
          onPageChange={vi.fn()}
          onFilterStatus={vi.fn()}
          currentStatus=""
          onRetry={handleRetry}
          retryingId={null}
        />
      );

      expect(screen.getByText("GRM-20261023-0001")).toBeDefined();
      expect(screen.getByText("Event Baru")).toBeDefined();
      expect(screen.getByText("Gagal (Retrying)")).toBeDefined();
      expect(screen.getByText(/Rate limit exceeded/i)).toBeDefined();

      const retryBtn = screen.getByRole("button", { name: /Ulangi/i });
      fireEvent.click(retryBtn);

      expect(handleRetry).toHaveBeenCalledWith("job-1");
    });
  });

  describe("ConflictResolutionCard", () => {
    it("menampilkan visual side-by-side perbandingan state lokal vs Google dan aksi resolusi", async () => {
      const mockConflict = {
        id: "conflict-123",
        conflictType: "REMOTE_MODIFIED",
        status: "PENDING",
        detectedAt: "2026-10-23T10:15:00.000Z",
        localSnapshot: {
          bookingCode: "GRM-20261023-8888",
          serviceName: "Full Grooming Special",
          startAt: "2026-10-23T14:00:00.000Z",
          occupancyEndAt: "2026-10-23T15:30:00.000Z",
          status: "CONFIRMED",
        },
        remoteSnapshot: {
          summary: "Grooming — Dimundurkan oleh Owner Google",
          start: "2026-10-23T15:00:00.000Z",
          end: "2026-10-23T16:30:00.000Z",
          status: "confirmed",
          etag: "etag-abc-123",
        },
        booking: {
          id: "b-8888",
          bookingCode: "GRM-20261023-8888",
          startAt: "2026-10-23T14:00:00.000Z",
          occupancyEndAt: "2026-10-23T15:30:00.000Z",
          status: "CONFIRMED",
          customer: { name: "Aditya Pratama", phone: "08123456789" },
          pet: { name: "Mochi" },
          service: { name: "Full Grooming Special" },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const handleResolved = vi.fn();

      render(
        <ConflictResolutionCard
          conflict={mockConflict}
          onResolved={handleResolved}
        />
      );

      // Verify side-by-side headings
      expect(screen.getByText("Data Lokal (PawCare Store)")).toBeDefined();
      expect(screen.getByText("Data Google Calendar")).toBeDefined();

      // Verify content
      expect(screen.getAllByText("GRM-20261023-8888").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Grooming — Dimundurkan oleh Owner Google")).toBeDefined();

      // Verify action buttons
      const keepLocalBtn = screen.getByRole("button", { name: /Pulihkan ke Google/i });
      const overwriteLocalBtn = screen.getByRole("button", { name: /Ikuti Google/i });
      expect(keepLocalBtn).toBeDefined();
      expect(overwriteLocalBtn).toBeDefined();

      // Click "Pulihkan ke Google"
      fireEvent.click(keepLocalBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/integrations/google/conflicts/conflict-123/resolve",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              action: "RESTORE_LOCAL_TO_GOOGLE",
              resolution: "KEEP_LOCAL",
            }),
          })
        );
        expect(handleResolved).toHaveBeenCalled();
      });
    });
  });
});
