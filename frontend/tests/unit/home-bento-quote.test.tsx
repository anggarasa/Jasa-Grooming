// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import { HomeBento } from "@/components/public/home/HomeBento";
import { QuoteBand } from "@/components/public/home/QuoteBand";

afterEach(cleanup);

/**
 * Penjaga dua keputusan desain yang dikonfirmasi pemilik pada 26 Okt 2026:
 *  1. Keempat kartu kategori Beranda SAMA (putih) saat diam, dan menyala hijau
 *     hanya saat hover — kartu hijau pada gambar referensi adalah keadaan hover.
 *  2. Kucing duduk (cutout) tampil di band kutipan sebagai hiasan murni.
 */
describe("HomeBento — kartu kategori", () => {
  it("merender 4 kartu yang semuanya menuju /services", () => {
    render(<HomeBento />);
    const links = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/services");
    expect(links).toHaveLength(4);
  });

  it("tidak ada kartu yang gelap secara bawaan: keempatnya memakai kelas yang sama persis", () => {
    render(<HomeBento />);
    const links = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/services");
    const classes = new Set(links.map((a) => a.className));
    expect(classes.size).toBe(1);
    const cls = [...classes][0];
    expect(cls).toContain("bg-white");
    expect(cls).not.toContain("bg-gradient-to-b");
  });

  it("setiap kartu punya lapisan gradien hijau terpisah yang menyala saat hover", () => {
    render(<HomeBento />);
    const links = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/services");
    for (const a of links) {
      const overlay = a.querySelector("span.absolute");
      expect(overlay).not.toBeNull();
      const cls = overlay!.className;
      // gradien yang sama dengan kartu "Masih Ragu?"
      expect(cls).toContain("from-forest-grad-a");
      expect(cls).toContain("to-forest-grad-b");
      // tidak terlihat saat diam, menyala saat hover, dan tidak menangkap klik
      expect(cls).toContain("opacity-0");
      expect(cls).toContain("group-hover:opacity-100");
      expect(cls).toContain("pointer-events-none");
      // berada DI BELAKANG isi kartu, bukan membungkusnya
      expect(cls).toContain("-z-10");
      expect(overlay!.getAttribute("aria-hidden")).toBe("true");
      expect(overlay!.children.length).toBe(0);
    }
  });

  it("judul dan deskripsi berganti warna saat hover agar tetap terbaca di atas hijau", () => {
    render(<HomeBento />);
    const judul = screen.getByText("Spa & Relaksasi");
    expect(judul.className).toContain("group-hover:text-white");
    const deskripsi = judul.parentElement!.querySelector("span:nth-child(2)")!;
    expect(deskripsi.className).toContain("text-ink-body");
    expect(deskripsi.className).toContain("group-hover:text-on-deep-muted");
  });
});

describe("QuoteBand — kucing cutout", () => {
  it("menampilkan kucing dari berkas yang disediakan pemilik", () => {
    const { container } = render(<QuoteBand />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toBe("/images/hero/pawcare-kucing-duduk.webp");
    expect(img!.getAttribute("width")).toBe("452");
    expect(img!.getAttribute("height")).toBe("582");
    expect(img!.getAttribute("loading")).toBe("lazy");
  });

  it("kucing adalah hiasan: alt kosong, aria-hidden, dan tidak menangkap klik", () => {
    const { container } = render(<QuoteBand />);
    const img = container.querySelector("img")!;
    expect(img.getAttribute("alt")).toBe("");
    expect(img.getAttribute("aria-hidden")).toBe("true");
    expect(img.className).toContain("pointer-events-none");
  });

  it("kucing tidak pernah disembunyikan di layar kecil, hanya diperkecil", () => {
    const { container } = render(<QuoteBand />);
    const cls = container.querySelector("img")!.className;
    expect(cls).not.toMatch(/(^|\s)hidden(\s|$)/);
    expect(cls).toContain("h-24"); // 96px di ponsel
    expect(cls).toContain("sm:h-[132px]");
    expect(cls).toContain("lg:h-[120px]"); // dikecilkan agar baris kutipan tidak jatuh di atas bulu
    expect(cls).toContain("wide:h-[246px]"); // ukuran referensi
  });

  it("ekor boleh keluar band: pemotongan dipindah ke pembungkus dekorasi saja", () => {
    const { container } = render(<QuoteBand />);
    const section = container.querySelector("section")!;
    expect(section.className).not.toContain("overflow-hidden");
    const decor = section.querySelector("div[aria-hidden='true']")!;
    expect(decor.className).toContain("overflow-hidden");
    expect(decor.className).toContain("rounded-band");
  });

  it("teks kutipan berada di atas kucing (bukan sebaliknya)", () => {
    const { container } = render(<QuoteBand />);
    const img = container.querySelector("img")!;
    const teks = screen.getByText(/Awalnya takut air/);
    expect(img.className).toContain("z-0");
    expect(teks.closest("[class*='z-10']")).not.toBeNull();
  });
});
