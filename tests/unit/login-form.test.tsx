// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "@/components/auth/LoginForm";
import * as authClient from "@/lib/auth/client";

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe("LoginForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender form login dengan elemen lengkap dan branding PawCare", () => {
    render(<LoginForm />);

    expect(screen.getByText("PawCare Grooming")).toBeDefined();
    expect(screen.getByText("Admin Portal")).toBeDefined();
    expect(screen.getByLabelText(/Email/i)).toBeDefined();
    expect(screen.getByLabelText("Kata Sandi")).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Masuk ke Dashboard/i })
    ).toBeDefined();
  });

  it("dapat mengubah visibilitas kata sandi saat tombol toggle diklik", () => {
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText("Kata Sandi") as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    const toggleButton = screen.getByRole("button", {
      name: /Tampilkan kata sandi/i,
    });
    fireEvent.click(toggleButton);

    expect(passwordInput.type).toBe("text");

    const hideButton = screen.getByRole("button", {
      name: /Sembunyikan kata sandi/i,
    });
    fireEvent.click(hideButton);

    expect(passwordInput.type).toBe("password");
  });

  it("menampilkan pesan validasi bahasa Indonesia saat form disubmit kosong", async () => {
    render(<LoginForm />);

    const submitBtn = screen.getByRole("button", { name: /Masuk ke Dashboard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Email wajib diisi")).toBeDefined();
      expect(screen.getByText("Kata sandi wajib diisi")).toBeDefined();
    });
  });

  it("menampilkan pesan error saat format email tidak valid", async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText("Kata Sandi");

    fireEvent.change(emailInput, { target: { value: "bukan-email-valid" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitBtn = screen.getByRole("button", { name: /Masuk ke Dashboard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Format email tidak valid")).toBeDefined();
    });
  });

  it("menampilkan alert error ketika API mengembalikan kegagalan kredensial", async () => {
    vi.spyOn(authClient, "loginApi").mockResolvedValueOnce({
      success: false,
      error: "Email atau kata sandi tidak valid.",
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText("Kata Sandi");

    fireEvent.change(emailInput, { target: { value: "admin@pawcare.id" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });

    const submitBtn = screen.getByRole("button", { name: /Masuk ke Dashboard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Email atau kata sandi tidak valid.")).toBeDefined();
    });
  });

  it("berhasil login dan mengarahkan ke /dashboard ketika kredensial valid", async () => {
    vi.spyOn(authClient, "loginApi").mockResolvedValueOnce({
      success: true,
      data: {
        user: {
          id: "user-123",
          name: "Dr. Budi Pratama",
          email: "admin@pawcare.id",
          role: "OWNER",
        },
      },
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText("Kata Sandi");

    fireEvent.change(emailInput, { target: { value: "admin@pawcare.id" } });
    fireEvent.change(passwordInput, { target: { value: "SecurePass123!@#" } });

    const submitBtn = screen.getByRole("button", { name: /Masuk ke Dashboard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });
});
