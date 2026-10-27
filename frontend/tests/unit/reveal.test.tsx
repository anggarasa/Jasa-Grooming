// @vitest-environment jsdom
import * as React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { Reveal } from "@/components/public/Reveal";

type IOCallback = (entries: { isIntersecting: boolean }[]) => void;

let observers: { cb: IOCallback; disconnected: boolean }[] = [];

class FakeIntersectionObserver {
  record: { cb: IOCallback; disconnected: boolean };
  constructor(cb: IOCallback) {
    this.record = { cb, disconnected: false };
    observers.push(this.record);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    this.record.disconnected = true;
  }
}

function setup({ reduced = false, top = 2000 }: { reduced?: boolean; top?: number } = {}) {
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top,
    bottom: top + 100,
    left: 0,
    right: 100,
    width: 100,
    height: 100,
    x: 0,
    y: top,
    toJSON: () => ({}),
  });
}

afterEach(() => {
  cleanup();
  observers = [];
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Reveal (scroll reveal)", () => {
  it("merender anak dan elemen yang diminta apa adanya (terlihat dari server)", () => {
    setup();
    render(
      <ul>
        <Reveal as="li" className="kartu" delay={160}>
          Isi kartu
        </Reveal>
      </ul>,
    );
    const li = screen.getByText("Isi kartu");
    expect(li.tagName).toBe("LI");
    expect(li.className).toBe("kartu");
    expect(li.style.getPropertyValue("--reveal-delay")).toBe("160ms");
  });

  it("menyembunyikan elemen yang masih di bawah layar lalu menampilkannya sekali saat terlihat", () => {
    setup({ top: 2000 });
    render(<Reveal>Bawah layar</Reveal>);
    const el = screen.getByText("Bawah layar");
    expect(el.getAttribute("data-reveal")).toBe("hidden");

    act(() => observers[0].cb([{ isIntersecting: false }]));
    expect(el.getAttribute("data-reveal")).toBe("hidden");

    act(() => observers[0].cb([{ isIntersecting: true }]));
    expect(el.getAttribute("data-reveal")).toBe("shown");
    expect(observers[0].disconnected).toBe(true); // tidak diputar ulang
  });

  it("tidak menyembunyikan elemen yang sudah terlihat saat halaman dibuka (tanpa kedipan)", () => {
    setup({ top: 100 });
    render(<Reveal>Sudah terlihat</Reveal>);
    expect(screen.getByText("Sudah terlihat").hasAttribute("data-reveal")).toBe(false);
    expect(observers.length).toBe(0);
  });

  it("tidak menyembunyikan apa pun saat prefers-reduced-motion: reduce", () => {
    setup({ reduced: true, top: 2000 });
    render(<Reveal>Tetap tampil</Reveal>);
    expect(screen.getByText("Tetap tampil").hasAttribute("data-reveal")).toBe(false);
    expect(observers.length).toBe(0);
  });

  it("tidak menyembunyikan apa pun bila browser tidak punya IntersectionObserver / matchMedia", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    // simulasi browser lama tanpa IntersectionObserver
    delete (window as { IntersectionObserver?: unknown }).IntersectionObserver;
    render(<Reveal>Browser lama</Reveal>);
    expect(screen.getByText("Browser lama").hasAttribute("data-reveal")).toBe(false);
  });

  it("melepas observer ketika komponen dilepas", () => {
    setup({ top: 2000 });
    const { unmount } = render(<Reveal>Dilepas</Reveal>);
    unmount();
    expect(observers[0].disconnected).toBe(true);
  });

  it("variant memberi penanda gaya; variant bawaan (rise) tidak menambah atribut", () => {
    setup();
    render(
      <>
        <Reveal>Biasa</Reveal>
        <Reveal variant="image">Foto</Reveal>
        <Reveal variant="stack">Susun</Reveal>
        <Reveal variant="fade">Pudar</Reveal>
      </>,
    );
    expect(screen.getByText("Biasa").hasAttribute("data-reveal-variant")).toBe(false);
    expect(screen.getByText("Foto").getAttribute("data-reveal-variant")).toBe("image");
    expect(screen.getByText("Susun").getAttribute("data-reveal-variant")).toBe("stack");
    expect(screen.getByText("Pudar").getAttribute("data-reveal-variant")).toBe("fade");
  });

  it("stagger mengisi urutan baris untuk layar sedang dan lebar; tanpa stagger tidak ada variabel", () => {
    setup();
    render(
      <>
        <Reveal stagger={[1, 2]}>Dua kolom</Reveal>
        <Reveal stagger={[3]}>Satu nilai</Reveal>
        <Reveal>Tanpa</Reveal>
      </>,
    );
    const a = screen.getByText("Dua kolom");
    expect(a.style.getPropertyValue("--i-md")).toBe("1");
    expect(a.style.getPropertyValue("--i-lg")).toBe("2");
    const b = screen.getByText("Satu nilai");
    expect(b.style.getPropertyValue("--i-md")).toBe("3");
    expect(b.style.getPropertyValue("--i-lg")).toBe("");
    const c = screen.getByText("Tanpa");
    expect(c.style.getPropertyValue("--i-md")).toBe("");
  });

  it("variant stack/image yang sudah terlihat saat dibuka tidak disembunyikan; reduced motion juga aman", () => {
    setup({ top: 100 });
    render(
      <Reveal variant="stack">
        <p>Anak</p>
      </Reveal>,
    );
    expect(screen.getByText("Anak").parentElement?.hasAttribute("data-reveal")).toBe(false);
    cleanup();
    setup({ reduced: true, top: 2000 });
    render(<Reveal variant="image">Foto</Reveal>);
    expect(screen.getByText("Foto").hasAttribute("data-reveal")).toBe(false);
    expect(observers.length).toBe(0);
  });
});
