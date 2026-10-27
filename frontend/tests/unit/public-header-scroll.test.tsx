// @vitest-environment jsdom
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/services" }));

import { PublicHeader } from "@/components/public/PublicHeader";
import type { PublicBusinessProfile } from "@backend/modules/public/public-business.service";
import type { PublicOperatingStatus } from "@backend/modules/public/public-hours.service";

const business = { name: "PawCare Grooming" } as unknown as PublicBusinessProfile;
const hours = { isOpenNow: true, statusText: "Buka", todayHours: null, schedule: [], timezone: "Asia/Jakarta" } as unknown as PublicOperatingStatus;

const setScroll = (y: number) => {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true, writable: true });
};
const scrollTo = (y: number) => act(() => {
  setScroll(y);
  window.dispatchEvent(new Event("scroll"));
});

let rafCallbacks: FrameRequestCallback[] = [];
beforeEach(() => {
  setScroll(0);
  rafCallbacks = [];
  // rAF sinkron-terkendali: callback dikumpulkan lalu dijalankan lewat flush()
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { rafCallbacks.push(cb); return rafCallbacks.length; });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const flush = () => act(() => { const cbs = rafCallbacks; rafCallbacks = []; cbs.forEach((cb) => cb(0)); });
const header = () => document.querySelector("header") as HTMLElement;
const bg = () => header().querySelector(".public-header-bg") as HTMLElement;
const renderHeader = () => render(<PublicHeader business={business} operatingStatus={hours} />);
// Menggulir: set posisi, kirim event, lalu jalankan frame animasi yang terjadwal.
const scrollAndFlush = (y: number) => { scrollTo(y); flush(); };

describe("PublicHeader — fixed + lapisan latar terpisah", () => {
  it("fixed di atas viewport dengan z-index di atas konten, dan ada penyangga di alur dokumen", () => {
    const { container } = renderHeader();
    const cls = header().className;
    expect(cls).toContain("fixed");
    expect(cls).toContain("top-0");
    expect(cls).toContain("z-40");
    expect(cls).not.toMatch(/\b(relative|sticky)\b/);
    // Penyangga (spacer) tepat sebelum header, tersembunyi dari pembaca layar, tinggi = tinggi header
    const spacer = container.firstElementChild as HTMLElement;
    expect(spacer.tagName).toBe("DIV");
    expect(spacer.getAttribute("aria-hidden")).toBe("true");
    expect(spacer.className).toMatch(/h-16/);
    expect(spacer.className).toMatch(/lg:h-\[79px\]/);
    expect(spacer.nextElementSibling).toBe(header());
  });

  it("latar adalah elemen terpisah: aria-hidden, tidak menangkap pointer, tanpa anak", () => {
    renderHeader();
    expect(bg()).not.toBeNull();
    expect(bg().getAttribute("aria-hidden")).toBe("true");
    expect(bg().className).toContain("pointer-events-none");
    expect(bg().className).toContain("absolute");
    expect(bg().children).toHaveLength(0);
  });

  it("logo, menu, dan tombol BUKAN keturunan lapisan blur, dan tak ada leluhur yang diberi blur/opacity", () => {
    renderHeader();
    const targets = [
      screen.getByRole("img", { name: "PawCare Grooming" }),
      screen.getByRole("navigation", { name: "Navigasi Utama" }),
      screen.getAllByRole("link", { name: /Booking Sekarang/ })[0],
    ];
    for (const el of targets) {
      expect(bg().contains(el)).toBe(false);
      for (let n: HTMLElement | null = el; n && n !== document.body; n = n.parentElement) {
        expect(n.className).not.toMatch(/(^|\s)(blur|backdrop-blur|filter|opacity-|backdrop-filter)/);
      }
    }
    // Lapisan latar ditaruh SEBELUM konten di DOM (konten tampil di atasnya)
    const inner = header().children[1] as HTMLElement;
    expect(bg().nextElementSibling).toBe(inner);
    expect(inner.className).toContain("relative");
  });

  it("semua tautan dan tombol fungsi tetap ada (tidak ada perubahan navigasi)", () => {
    renderHeader();
    const nav = screen.getByRole("navigation", { name: "Navigasi Utama" });
    const hrefs = Array.from(nav.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/", "/services", "/gallery", "/about", "/contact"]);
    expect(nav.querySelector('[aria-current="page"]')?.textContent).toBe("Layanan");
    expect(screen.getByRole("button", { name: "Buka Menu Navigasi" })).toBeDefined();
  });
});

describe("PublicHeader — status scroll", () => {
  it("awal: belum scroll (data-scrolled=false)", () => {
    renderHeader(); flush();
    expect(header().getAttribute("data-scrolled")).toBe("false");
  });

  it("melewati ambang → true; histeresis → baru kembali false setelah ≤ 8px", () => {
    renderHeader(); flush();
    scrollAndFlush(12);
    expect(header().getAttribute("data-scrolled")).toBe("false"); // 12 < ambang 16
    scrollAndFlush(30);
    expect(header().getAttribute("data-scrolled")).toBe("true");
    scrollAndFlush(12);
    expect(header().getAttribute("data-scrolled")).toBe("true"); // masih di atas ambang matikan (8) → tidak berkedip
    scrollAndFlush(8);
    expect(header().getAttribute("data-scrolled")).toBe("false");
  });

  it("halaman dimuat sudah tergulir (mis. refresh di tengah halaman) → langsung aktif", () => {
    setScroll(600);
    renderHeader(); flush();
    expect(header().getAttribute("data-scrolled")).toBe("true");
  });

  it("efisien: melewati ambang = satu perubahan state; puluhan event scroll berikutnya tidak menambah render", () => {
    const commits = vi.fn();
    render(
      <React.Profiler id="hdr" onRender={commits}>
        <PublicHeader business={business} operatingStatus={hours} />
      </React.Profiler>
    );
    flush();
    const base = commits.mock.calls.length;
    scrollAndFlush(100); // transisi: render bertambah (Radix menambah satu "nested-update" per commit)
    const afterTransition = commits.mock.calls.length;
    expect(afterTransition).toBeGreaterThan(base);
    expect(afterTransition - base).toBeLessThanOrEqual(2);

    for (let y = 101; y < 161; y++) scrollTo(y); // 60 event tanpa flush → hanya SATU frame terjadwal
    expect(rafCallbacks).toHaveLength(1);
    flush();
    for (let y = 161; y < 221; y++) scrollAndFlush(y); // 60 event + frame lagi, tetap di sisi yang sama
    expect(commits.mock.calls.length).toBe(afterTransition); // nol render tambahan
  });

  it("listener scroll pasif dan dibersihkan saat komponen dilepas", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHeader();
    const call = add.mock.calls.find((c) => c[0] === "scroll")!;
    expect(call).toBeDefined();
    expect((call[2] as AddEventListenerOptions).passive).toBe(true);
    unmount();
    expect(remove.mock.calls.some((c) => c[0] === "scroll" && c[1] === call[1])).toBe(true);
    expect(window.cancelAnimationFrame).toBeDefined();
  });
});
