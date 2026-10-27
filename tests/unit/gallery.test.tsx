// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { render, screen, fireEvent, within } from "@testing-library/react";
import {
  availableCategories,
  buildGalleryItems,
  pickShowcase,
  STATIC_GALLERY_PHOTOS,
} from "@/components/public/gallery/gallery-data";
import { GalleryExplorer } from "@/components/public/gallery/GalleryExplorer";
import type { PublicGalleryItem } from "@backend/modules/public/public-gallery.service";

const dbItem = (n: number, objectKey: string, extra: Partial<PublicGalleryItem> = {}): PublicGalleryItem => ({
  id: `db${n}`,
  objectKey,
  caption: `Keterangan DB ${n}`,
  altText: `Alt DB ${n}`,
  displayOrder: n,
  createdAt: new Date(),
  ...extra,
});

const seeded = dbItem(1, "gallery/images/salon-facility.webp", {
  caption: "Area Grooming Bersih Ber-AC",
  altText: "Ruangan salon bersih dengan meja hidrolik dan sterilisasi UV",
});

describe("buildGalleryItems", () => {
  it("mengganti alt/keterangan menyesatkan pada foto stok bawaan seed, hanya di tampilan", () => {
    const items = buildGalleryItems([seeded]);
    const first = items[0];
    expect(first.alt).toBe("Anjing bulldog Prancis berkaus kuning duduk di depan latar biru");
    // keterangan menyesatkan ("Area Grooming Bersih Ber-AC") tidak ditampilkan lagi
    expect(first.caption).toBeNull();
    expect(first.category).toBe("momen");
    expect(first.src).toBe("/api/media/gallery/images/salon-facility.webp");
    // objek input tidak dimutasi (data database tidak berubah)
    expect(seeded.altText).toBe("Ruangan salon bersih dengan meja hidrolik dan sterilisasi UV");
  });

  it("mempertahankan alt dan keterangan foto unggahan admin (kunci selain bawaan seed)", () => {
    const items = buildGalleryItems([dbItem(9, "gallery/images/unggahan-admin.webp")]);
    expect(items[0].alt).toBe("Alt DB 9");
    expect(items[0].caption).toBe("Keterangan DB 9");
    expect(items[0].category).toBe("momen");
  });

  it("memakai alt cadangan bila foto admin tidak punya alt maupun keterangan", () => {
    const items = buildGalleryItems([
      dbItem(1, "gallery/images/x.webp", { altText: null, caption: null }),
    ]);
    expect(items[0].alt).toBe("Foto galeri PawCare 1");
  });

  it("menaruh foto database lebih dulu, lalu seluruh foto pelengkap", () => {
    const items = buildGalleryItems([seeded]);
    expect(items).toHaveLength(1 + STATIC_GALLERY_PHOTOS.length);
    expect(items[0].id).toBe("db1");
    expect(items[1].id.startsWith("static-")).toBe(true);
  });

  it("setiap foto pelengkap punya berkas nyata, alt tidak kosong, dan dimensi valid", () => {
    for (const photo of STATIC_GALLERY_PHOTOS) {
      expect(existsSync(join(process.cwd(), "public/images/photos", photo.file))).toBe(true);
      expect(photo.alt.length).toBeGreaterThan(10);
      expect(photo.width).toBeGreaterThan(0);
      expect(photo.height).toBeGreaterThan(0);
    }
  });

  it("tidak ada foto yang dipakai dua kali", () => {
    const files = STATIC_GALLERY_PHOTOS.map((p) => p.file);
    expect(new Set(files).size).toBe(files.length);
  });

  it("hanya menyediakan kategori yang benar-benar punya foto", () => {
    const cats = availableCategories(buildGalleryItems([]));
    expect(cats.map((c) => c.id)).toEqual(["hasil", "proses", "momen"]);
    expect(cats.every((c) => c.count > 0)).toBe(true);
    const onlyMomen = availableCategories(buildGalleryItems([]).filter((i) => i.category === "momen"));
    expect(onlyMomen.map((c) => c.id)).toEqual(["momen"]);
  });
});

function setup() {
  const items = buildGalleryItems([seeded]);
  const categories = availableCategories(items);
  render(<GalleryExplorer items={items} categories={categories} />);
  return { items, categories };
}

describe("GalleryExplorer", () => {
  it("menampilkan chip kategori dengan jumlah dan 'Semua' aktif di awal", () => {
    const { items } = setup();
    const nav = screen.getByRole("navigation", { name: "Filter Kategori Galeri" });
    const semua = within(nav).getByRole("button", { name: /^Semua/ });
    expect(semua.getAttribute("aria-pressed")).toBe("true");
    expect(semua.textContent).toContain(String(items.length));
    expect(within(nav).getByRole("button", { name: /Hasil Grooming/ })).toBeDefined();
    expect(within(nav).getByRole("button", { name: /Proses Perawatan/ })).toBeDefined();
    expect(within(nav).getByRole("button", { name: /Momen Anabul/ })).toBeDefined();
  });

  it("memfilter foto per kategori dan mengumumkan hasilnya", () => {
    const { items } = setup();
    const nav = screen.getByRole("navigation", { name: "Filter Kategori Galeri" });
    const expected = items.filter((i) => i.category === "hasil").length;

    fireEvent.click(within(nav).getByRole("button", { name: /Hasil Grooming/ }));
    expect(screen.getAllByRole("button", { name: /^Perbesar/ })).toHaveLength(expected);
    expect(screen.getByRole("status").textContent).toMatch(new RegExp(`${expected}\\s*foto kategori`));
    expect(
      within(nav).getByRole("button", { name: /Hasil Grooming/ }).getAttribute("aria-pressed")
    ).toBe("true");

    fireEvent.click(within(nav).getByRole("button", { name: /^Semua/ }));
    expect(screen.getAllByRole("button", { name: /^Perbesar/ })).toHaveLength(items.length);
  });

  it("setiap foto punya alt deskriptif; hanya 3 foto teratas dimuat langsung, sisanya lazy", () => {
    setup();
    const imgs = Array.from(document.querySelectorAll("ul img")) as HTMLImageElement[];
    expect(imgs.length).toBeGreaterThan(10);
    expect(imgs.every((img) => (img.getAttribute("alt") || "").length > 10)).toBe(true);
    expect(imgs.slice(0, 3).every((img) => img.getAttribute("loading") === "eager")).toBe(true);
    expect(imgs.slice(3).every((img) => img.getAttribute("loading") === "lazy")).toBe(true);
  });

  it("memakai rasio asli tiap foto (tidak memaksa crop seragam)", () => {
    setup();
    const tiles = Array.from(document.querySelectorAll("ul button")) as HTMLElement[];
    const ratios = new Set(tiles.map((t) => t.style.aspectRatio));
    expect(ratios.size).toBeGreaterThan(3);
  });

  it("membuka lightbox, bernavigasi di dalam hasil filter, dan menutup dengan Escape + fokus kembali", () => {
    setup();
    const nav = screen.getByRole("navigation", { name: "Filter Kategori Galeri" });
    fireEvent.click(within(nav).getByRole("button", { name: /Hasil Grooming/ }));

    const tiles = screen.getAllByRole("button", { name: /^Perbesar/ });
    fireEvent.click(tiles[0]);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(within(dialog).getByText(new RegExp(`1 / ${tiles.length}`))).toBeDefined();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(within(screen.getByRole("dialog")).getByText(new RegExp(`2 / ${tiles.length}`))).toBeDefined();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement?.id).toBe(tiles[1].id);
  });

  it("menampilkan pesan kosong bila tidak ada foto sama sekali", () => {
    render(<GalleryExplorer items={[]} categories={[]} />);
    expect(screen.getByText("Belum Ada Foto dalam Galeri")).toBeDefined();
  });
});

describe("pickShowcase", () => {
  const all = buildGalleryItems([seeded]);

  it("hanya memilih foto landscape (wajah tidak terpotong kartu 4:3)", () => {
    const picked = pickShowcase(all, 6);
    expect(picked).toHaveLength(6);
    expect(picked.every((i) => i.width >= i.height * 1.2)).toBe(true);
  });

  it("bergantian antar kategori dan tidak mengulang foto", () => {
    const picked = pickShowcase(all, 6);
    expect(new Set(picked.map((i) => i.id)).size).toBe(6);
    expect(new Set(picked.map((i) => i.category)).size).toBeGreaterThanOrEqual(2);
  });

  it("mengembalikan lebih sedikit bila foto landscape tidak cukup", () => {
    expect(pickShowcase(all, 100).length).toBeLessThanOrEqual(all.length);
    expect(pickShowcase([], 6)).toEqual([]);
  });
});
