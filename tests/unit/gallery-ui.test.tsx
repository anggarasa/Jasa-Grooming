// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GalleryManager } from "@/components/dashboard/GalleryManager";
import { ImageUploadDropzone } from "@/components/media/ImageUploadDropzone";
import * as businessClient from "@/lib/business-client";
import { AuthenticatedUser } from "@backend/modules/auth/types";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => "/dashboard/gallery",
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

const mockGalleryItems: businessClient.GalleryItem[] = [
  {
    id: "gal-1",
    businessId: "biz-1",
    objectKey: "gallery/images/gerai-utama.webp",
    caption: "Area Resepsionis & Ruang Tunggu Nyaman",
    altText: "Ruang tunggu klinik dan salon PawCare",
    displayOrder: 0,
    isActive: true,
    createdAt: "2026-10-21T00:00:00Z",
    updatedAt: "2026-10-21T00:00:00Z",
  },
  {
    id: "gal-2",
    businessId: "biz-1",
    objectKey: "gallery/images/spa-kucing.webp",
    caption: "Bak Mandi Spa Khusus Kucing",
    altText: "Kucing persia sedang mandi relaksasi",
    displayOrder: 1,
    isActive: false,
    createdAt: "2026-10-22T00:00:00Z",
    updatedAt: "2026-10-22T00:00:00Z",
  },
];

describe("ImageUploadDropzone Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender state dropzone kosong dengan petunjuk format berkas", () => {
    const handleChange = vi.fn();
    render(
      <ImageUploadDropzone
        folder="services/images"
        value={null}
        onChange={handleChange}
        label="Foto Profil"
      />
    );

    expect(screen.getByText("Foto Profil")).toBeDefined();
    expect(screen.getByText(/Klik untuk unggah atau seret berkas ke sini/i)).toBeDefined();
  });

  it("merender pratinjau gambar dan tombol aksi jika value ada", () => {
    const handleChange = vi.fn();
    render(
      <ImageUploadDropzone
        folder="business/logos"
        value="business/logos/sample.webp"
        onChange={handleChange}
        label="Logo Toko"
      />
    );

    expect(screen.getByAltText("Logo Toko")).toBeDefined();
    expect(screen.getByRole("button", { name: /Ganti/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Hapus/i })).toBeDefined();

    const deleteBtn = screen.getByRole("button", { name: /Hapus/i });
    fireEvent.click(deleteBtn);
    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it("menolak berkas yang melebihi batas ukuran 5MB", async () => {
    const handleChange = vi.fn();
    render(
      <ImageUploadDropzone
        folder="services/images"
        value={null}
        onChange={handleChange}
        label="Unggah Berkas"
      />
    );

    const fileInput = screen.getByLabelText("Unggah Berkas") as HTMLInputElement;

    // Buat file fiktif 6MB
    const bigFile = new File(["a".repeat(100)], "big.png", { type: "image/png" });
    Object.defineProperty(bigFile, "size", { value: 6 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [bigFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Ukuran berkas melebihi batas 5 MB/i)).toBeDefined();
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  it("menolak berkas dengan format yang tidak didukung", async () => {
    const handleChange = vi.fn();
    render(
      <ImageUploadDropzone
        folder="services/images"
        value={null}
        onChange={handleChange}
        label="Unggah Gambar"
      />
    );

    const fileInput = screen.getByLabelText("Unggah Gambar") as HTMLInputElement;

    const invalidFile = new File(["dummy"], "vector.svg", { type: "image/svg+xml" });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Format berkas tidak didukung/i)).toBeDefined();
      expect(handleChange).not.toHaveBeenCalled();
    });
  });
});

describe("GalleryManager Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.pointerEvents = "auto";
    document.body.removeAttribute("data-scroll-locked");
  });

  it("merender grid kartu galeri foto dengan caption dan badge", () => {
    render(
      <GalleryManager
        initialGallery={mockGalleryItems}
        user={mockUser}
      />
    );

    expect(screen.getByText("Galeri Foto Bisnis")).toBeDefined();
    expect(screen.getByText("Area Resepsionis & Ruang Tunggu Nyaman")).toBeDefined();
    expect(screen.getByText("Bak Mandi Spa Khusus Kucing")).toBeDefined();
    expect(screen.getByRole("button", { name: /Unggah Foto Baru/i })).toBeDefined();
  });

  it("dapat memfilter foto galeri aktif saja", () => {
    render(
      <GalleryManager
        initialGallery={mockGalleryItems}
        user={mockUser}
      />
    );

    const filterSelect = screen.getByRole("combobox");
    fireEvent.change(filterSelect, { target: { value: "ACTIVE" } });

    expect(screen.getByText("Area Resepsionis & Ruang Tunggu Nyaman")).toBeDefined();
    expect(screen.queryByText("Bak Mandi Spa Khusus Kucing")).toBeNull();
  });

  it("dapat membuka dialog unggah foto baru dan memiliki batasan max-h serta overflow scroll", async () => {
    render(
      <GalleryManager
        initialGallery={mockGalleryItems}
        user={mockUser}
      />
    );

    const uploadBtn = screen.getByRole("button", { name: /Unggah Foto Baru/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeDefined();
      expect(dialog.className).toContain("max-h-[85vh]");
      expect(dialog.className).toContain("overflow-y-auto");
      expect(
        screen.getByRole("heading", { name: "Unggah Foto Galeri Baru" })
      ).toBeDefined();
    });
  });

  it("dapat membuka dialog konfirmasi hapus foto", async () => {
    render(
      <GalleryManager
        initialGallery={mockGalleryItems}
        user={mockUser}
      />
    );

    const deleteButtons = screen.getAllByRole("button", { name: "Hapus Foto" });
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Hapus Foto dari Galeri?")).toBeDefined();
      expect(screen.getByRole("button", { name: "Ya, Hapus Permanen" })).toBeDefined();
    });
  });
});
