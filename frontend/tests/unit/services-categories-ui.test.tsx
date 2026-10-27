// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CategoryManager } from "@/components/dashboard/CategoryManager";
import { ServicesList } from "@/components/dashboard/ServicesList";
import { ServiceForm } from "@/components/dashboard/ServiceForm";
import * as businessClient from "@/lib/business-client";
import { AuthenticatedUser } from "@backend/modules/auth/types";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => "/dashboard/services",
}));

const mockUser: AuthenticatedUser = {
  id: "user-1",
  name: "Budi Pratama",
  email: "budi@pawcare.id",
  role: "OWNER",
  tokenVersion: 1,
  isActive: true,
  lastLoginAt: null,
  passwordChangedAt: null,
};

const mockCategories: businessClient.ServiceCategory[] = [
  {
    id: "cat-1",
    businessId: "biz-1",
    name: "Full Grooming",
    slug: "full-grooming",
    description: "Perawatan menyeluruh dari mandi hingga styling bulu.",
    displayOrder: 0,
    isActive: true,
    createdAt: "2026-10-20T00:00:00Z",
    updatedAt: "2026-10-20T00:00:00Z",
    _count: { services: 2 },
  },
  {
    id: "cat-2",
    businessId: "biz-1",
    name: "Bath & Blowdry",
    slug: "bath-blowdry",
    description: "Mandi bersih wangi dan pengeringan bulu.",
    displayOrder: 1,
    isActive: true,
    createdAt: "2026-10-20T00:00:00Z",
    updatedAt: "2026-10-20T00:00:00Z",
    _count: { services: 1 },
  },
];

const mockServices: businessClient.GroomingService[] = [
  {
    id: "srv-1",
    businessId: "biz-1",
    categoryId: "cat-1",
    name: "Paket Full Grooming Kucing Ras",
    slug: "paket-full-grooming-kucing-ras",
    shortDescription: "Mandi spa, potong kuku, bulu rapi.",
    fullDescription: "Paket lengkap khusus anabul kesayangan.",
    price: 150000,
    durationMinutes: 60,
    bufferMinutes: 15,
    imageObjectKey: "services/images/cat-grooming.webp",
    displayOrder: 0,
    isActive: true,
    createdAt: "2026-10-20T00:00:00Z",
    updatedAt: "2026-10-20T00:00:00Z",
    category: {
      id: "cat-1",
      name: "Full Grooming",
      slug: "full-grooming",
    },
    _count: { bookings: 0 },
  },
  {
    id: "srv-2",
    businessId: "biz-1",
    categoryId: "cat-2",
    name: "Mandi Kutu & Jamur Medicated",
    slug: "mandi-kutu-jamur-medicated",
    shortDescription: "Sampo belerang medis antiseptik.",
    fullDescription: "Terapi kutu dan jamur membandel.",
    price: 180000,
    durationMinutes: 45,
    bufferMinutes: 15,
    imageObjectKey: null,
    displayOrder: 1,
    isActive: false,
    createdAt: "2026-10-21T00:00:00Z",
    updatedAt: "2026-10-21T00:00:00Z",
    category: {
      id: "cat-2",
      name: "Bath & Blowdry",
      slug: "bath-blowdry",
    },
    _count: { bookings: 3 },
  },
];

describe("CategoryManager Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender daftar kategori layanan dengan jumlah layanan terkait", () => {
    render(
      <CategoryManager
        initialCategories={mockCategories}
        user={mockUser}
      />
    );

    expect(screen.getByText("Kategori Layanan")).toBeDefined();
    expect(screen.getByText("Full Grooming")).toBeDefined();
    expect(screen.getByText("Bath & Blowdry")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined(); // services count for cat-1
  });

  it("dapat membuka modal tambah kategori baru", async () => {
    render(
      <CategoryManager
        initialCategories={mockCategories}
        user={mockUser}
      />
    );

    const addBtn = screen.getByRole("button", { name: /Tambah Kategori/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText("Tambah Kategori Baru")).toBeDefined();
      expect(screen.getByLabelText("Nama Kategori")).toBeDefined();
    });
  });

  it("dapat membuka dialog konfirmasi hapus", async () => {
    render(
      <CategoryManager
        initialCategories={mockCategories}
        user={mockUser}
      />
    );

    const deleteBtn = screen.getByRole("button", { name: "Hapus kategori Full Grooming" });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText("Hapus Kategori Layanan?")).toBeDefined();
      expect(screen.getByRole("button", { name: "Ya, Hapus Kategori" })).toBeDefined();
    });
  });
});

describe("ServicesList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender katalog layanan dengan harga format Rupiah dan durasi", () => {
    render(
      <ServicesList
        initialServices={mockServices}
        categories={mockCategories}
        user={mockUser}
      />
    );

    expect(screen.getByText("Katalog Layanan Grooming")).toBeDefined();
    expect(screen.getByText("Paket Full Grooming Kucing Ras")).toBeDefined();
    expect(screen.getByText("Mandi Kutu & Jamur Medicated")).toBeDefined();
    expect(screen.getByText("60 mnt")).toBeDefined();
  });

  it("memfilter layanan berdasarkan kata kunci pencarian", () => {
    render(
      <ServicesList
        initialServices={mockServices}
        categories={mockCategories}
        user={mockUser}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Cari nama layanan/i);
    fireEvent.change(searchInput, { target: { value: "Kutu" } });

    expect(screen.getByText("Mandi Kutu & Jamur Medicated")).toBeDefined();
    expect(screen.queryByText("Paket Full Grooming Kucing Ras")).toBeNull();
  });

  it("dapat membuka modal konfirmasi saat klik tombol hapus", async () => {
    render(
      <ServicesList
        initialServices={mockServices}
        categories={mockCategories}
        user={mockUser}
      />
    );

    const deleteBtn = screen.getByRole("button", {
      name: "Hapus layanan Paket Full Grooming Kucing Ras",
    });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText("Hapus Layanan Grooming?")).toBeDefined();
      expect(
        screen.getByRole("button", { name: "Ya, Hapus / Nonaktifkan" })
      ).toBeDefined();
    });
  });
});

describe("ServiceForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender form pembuatan layanan baru dan membuat slug otomatis", async () => {
    render(
      <ServiceForm
        mode="create"
        categories={mockCategories}
        user={mockUser}
      />
    );

    expect(screen.getByText("Tambah Layanan Grooming Baru")).toBeDefined();

    const nameInput = screen.getByLabelText(/Nama Layanan Grooming/i);
    fireEvent.change(nameInput, { target: { value: "Puppy Gentle Bath" } });

    await waitFor(() => {
      const slugInput = screen.getByLabelText(/Slug Sistem/i);
      expect((slugInput as HTMLInputElement).value).toBe("puppy-gentle-bath");
    });
  });

  it("merender form edit dengan data awal yang telah terisi", () => {
    render(
      <ServiceForm
        mode="edit"
        initialService={mockServices[0]}
        categories={mockCategories}
        user={mockUser}
      />
    );

    expect(screen.getByText("Edit Layanan Grooming")).toBeDefined();
    expect(screen.getByDisplayValue("Paket Full Grooming Kucing Ras")).toBeDefined();
    expect(screen.getByDisplayValue("paket-full-grooming-kucing-ras")).toBeDefined();
    expect(screen.getByRole("button", { name: /Simpan Perubahan/i })).toBeDefined();
  });
});
