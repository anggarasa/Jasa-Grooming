// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { SecurityForm } from "@/components/dashboard/SecurityForm";
import { SessionsManager } from "@/components/dashboard/SessionsManager";
import * as authClient from "@/lib/auth/client";
import { AuthenticatedUser } from "@backend/modules/auth/types";

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => "/dashboard",
}));

const mockUserOwner: AuthenticatedUser = {
  id: "user-owner-1",
  name: "Budi Pratama",
  email: "budi@pawcare.id",
  role: "OWNER",
  tokenVersion: 1,
  isActive: true,
  lastLoginAt: new Date("2026-10-23T05:00:00Z"),
  passwordChangedAt: new Date("2026-10-20T10:00:00Z"),
};

const mockUserAdmin: AuthenticatedUser = {
  id: "user-admin-2",
  name: "Siti Rahma",
  email: "siti@pawcare.id",
  role: "ADMIN",
  tokenVersion: 1,
  isActive: true,
  lastLoginAt: new Date("2026-10-23T04:30:00Z"),
  passwordChangedAt: null,
};

describe("DashboardSidebar Component", () => {
  it("merender branding PawCare Grooming, menu operasional, dan navigasi Phase 03", () => {
    render(<DashboardSidebar />);

    // Nama merek kini dibawa oleh atribut alt logo PawCare resmi (sama seperti
    // LoginForm dan footer publik), bukan teks biasa.
    expect(screen.getByAltText("PawCare Grooming")).toBeDefined();
    // Subjudul "Admin Portal v1.0" dihapus atas permintaan pemilik (26 Okt 2026);
    // identitas sidebar kini cukup lewat logo PawCare resmi di atas.
    expect(screen.queryByText("Admin Portal v1.0")).toBeNull();
    expect(screen.getByText("Ringkasan")).toBeDefined();
    expect(screen.getByText("Semua Layanan")).toBeDefined();
    expect(screen.getByText("Kategori Layanan")).toBeDefined();
    expect(screen.getByText("Galeri Bisnis")).toBeDefined();
    expect(screen.getByText("Profil Bisnis")).toBeDefined();
    expect(screen.getByText("Jam Operasional")).toBeDefined();
    expect(screen.getByText("Pengaturan Reservasi")).toBeDefined();
    expect(screen.getByText("Profil Saya")).toBeDefined();
    expect(screen.getByText("Keamanan Akun")).toBeDefined();
    expect(screen.getByText("Sesi Aktif")).toBeDefined();
  });

  it("merender menu Pemesanan, Kalender, Pelanggan, dan Blokir Waktu dalam keadaan aktif", () => {
    render(<DashboardSidebar />);

    expect(screen.getByText("Pemesanan")).toBeDefined();
    expect(screen.getByText("Kalender")).toBeDefined();
    expect(screen.getByText("Pelanggan")).toBeDefined();
    expect(screen.getByText("Blokir Waktu")).toBeDefined();
  });
});

describe("DashboardTopNav Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock PointerEvent & capture methods for Radix UI in JSDOM
    if (typeof window !== "undefined") {
      window.HTMLElement.prototype.hasPointerCapture = () => false;
      window.HTMLElement.prototype.setPointerCapture = () => {};
      window.HTMLElement.prototype.releasePointerCapture = () => {};
      window.HTMLElement.prototype.scrollIntoView = () => {};
    }
  });

  it("merender breadcrumb, role badge OWNER, dan inisial avatar", () => {
    render(<DashboardTopNav user={mockUserOwner} />);

    expect(screen.getByText("Ringkasan Operasional")).toBeDefined();
    expect(screen.getByText("Pemilik (Owner)")).toBeDefined();
    expect(screen.getByText("BP")).toBeDefined(); // Inisial Budi Pratama
  });

  it("merender role badge Admin ketika role pengguna adalah ADMIN", () => {
    render(<DashboardTopNav user={mockUserAdmin} />);

    expect(screen.getByText("Admin")).toBeDefined();
    expect(screen.getByText("SR")).toBeDefined(); // Inisial Siti Rahma
  });

  it("merender informasi nama dan email pengguna pada topbar", () => {
    render(<DashboardTopNav user={mockUserOwner} />);

    expect(screen.getByText("Budi Pratama")).toBeDefined();
    expect(screen.getByText("budi@pawcare.id")).toBeDefined();
  });
});

describe("ProfileForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender data profil awal dengan benar", () => {
    render(<ProfileForm user={mockUserOwner} />);

    expect(screen.getByDisplayValue("Budi Pratama")).toBeDefined();
    expect(screen.getByDisplayValue("budi@pawcare.id")).toBeDefined();
    expect(screen.getByText("Pemilik (Owner)")).toBeDefined();
    expect(screen.getByText("Aktif & Terverifikasi")).toBeDefined();
  });

  it("dapat memperbarui nama pengguna melalui API", async () => {
    vi.spyOn(authClient, "updateProfileApi").mockResolvedValueOnce({
      success: true,
      data: {
        user: {
          id: mockUserOwner.id,
          name: "Budi Pratama S.Kom",
          email: mockUserOwner.email,
          role: mockUserOwner.role,
        },
      },
    });

    render(<ProfileForm user={mockUserOwner} />);

    const nameInput = screen.getByLabelText(/Nama Lengkap/i);
    fireEvent.change(nameInput, { target: { value: "Budi Pratama S.Kom" } });

    const saveBtn = screen.getByRole("button", { name: /Simpan Perubahan/i });
    expect(saveBtn).toBeDefined();
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(authClient.updateProfileApi).toHaveBeenCalledWith({
        name: "Budi Pratama S.Kom",
      });
    });
  });
});

describe("SecurityForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender field kata sandi dan daftar kriteria kata sandi", () => {
    render(<SecurityForm />);

    expect(screen.getByLabelText("Kata Sandi Saat Ini")).toBeDefined();
    expect(screen.getByLabelText("Kata Sandi Baru")).toBeDefined();
    expect(screen.getByLabelText("Konfirmasi Kata Sandi Baru")).toBeDefined();

    expect(screen.getByText("Minimal 12 karakter")).toBeDefined();
    expect(screen.getByText(/Minimal 1 huruf kapital/i)).toBeDefined();
    expect(screen.getByText(/Minimal 1 angka/i)).toBeDefined();
    expect(screen.getByText(/Minimal 1 simbol/i)).toBeDefined();
  });

  it("memvalidasi dan mengirim form perubahan kata sandi ke API", async () => {
    vi.spyOn(authClient, "changePasswordApi").mockResolvedValueOnce({
      success: true,
      message: "Kata sandi berhasil diperbarui.",
    });

    render(<SecurityForm />);

    const currentPass = screen.getByLabelText("Kata Sandi Saat Ini");
    const newPass = screen.getByLabelText("Kata Sandi Baru");
    const confirmPass = screen.getByLabelText("Konfirmasi Kata Sandi Baru");

    fireEvent.change(currentPass, { target: { value: "OldPassword123!@" } });
    fireEvent.change(newPass, { target: { value: "NewSecurePass123!@#" } });
    fireEvent.change(confirmPass, { target: { value: "NewSecurePass123!@#" } });

    const submitBtn = screen.getByRole("button", { name: /Perbarui Kata Sandi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authClient.changePasswordApi).toHaveBeenCalledWith({
        currentPassword: "OldPassword123!@",
        newPassword: "NewSecurePass123!@#",
        confirmPassword: "NewSecurePass123!@#",
      });
    });
  });
});

describe("SessionsManager Component", () => {
  const mockSessions: authClient.SessionItem[] = [
    {
      id: "sess-1",
      userId: "user-1",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ipAddress: "192.168.1.10",
      createdAt: new Date("2026-10-23T04:00:00Z").toISOString(),
      updatedAt: new Date("2026-10-23T05:00:00Z").toISOString(),
      expiresAt: new Date("2026-10-30T05:00:00Z").toISOString(),
      isCurrent: true,
    },
    {
      id: "sess-2",
      userId: "user-1",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
      ipAddress: "182.253.10.5",
      createdAt: new Date("2026-10-22T10:00:00Z").toISOString(),
      updatedAt: new Date("2026-10-22T11:00:00Z").toISOString(),
      expiresAt: new Date("2026-10-29T10:00:00Z").toISOString(),
      isCurrent: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender daftar sesi aktif dengan badge Perangkat Saat Ini", () => {
    render(<SessionsManager initialSessions={mockSessions} />);

    expect(screen.getByText(/Google Chrome di Windows/i)).toBeDefined();
    expect(screen.getByText(/Apple Safari di iOS/i)).toBeDefined();
    expect(screen.getByText("Perangkat Saat Ini")).toBeDefined();
    expect(screen.getByText("Sesi Aktif Utama")).toBeDefined();
    expect(screen.getByText("Cabut Sesi")).toBeDefined();
  });

  it("membuka modal konfirmasi saat tombol Cabut Sesi diklik", async () => {
    render(<SessionsManager initialSessions={mockSessions} />);

    const revokeBtn = screen.getByText("Cabut Sesi");
    fireEvent.click(revokeBtn);

    await waitFor(() => {
      expect(screen.getByText("Cabut Sesi Perangkat?")).toBeDefined();
      expect(screen.getByRole("button", { name: "Ya, Cabut Sesi" })).toBeDefined();
    });
  });

  it("membuka modal konfirmasi saat tombol Logout Semua Perangkat diklik", async () => {
    render(<SessionsManager initialSessions={mockSessions} />);

    const logoutAllBtn = screen.getByText("Logout Semua Perangkat");
    fireEvent.click(logoutAllBtn);

    await waitFor(() => {
      expect(screen.getByText("Keluar dari Semua Perangkat?")).toBeDefined();
      expect(
        screen.getByRole("button", { name: "Ya, Keluar dari Semua Perangkat" })
      ).toBeDefined();
    });
  });
});
