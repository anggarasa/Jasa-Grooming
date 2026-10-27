"use client";

import * as React from "react";

type RevealTag = "div" | "li" | "section" | "figure" | "p" | "span";
type RevealVariant = "rise" | "fade" | "stack" | "image";

interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  /** Elemen HTML yang dirender (agar tidak menambah pembungkus yang merusak layout). */
  as?: RevealTag;
  /** Jeda sebelum mulai (ms). Dipakai untuk stagger kecil pada grup (60–100ms per langkah). */
  delay?: number;
  /** Jarak geser awal (px). Bawaan 22px (token --motion-rise). */
  distance?: number;
  /**
   * Gaya masuk (docs/redesign/motion-system.md §4):
   *  - "rise"  (bawaan): opacity + naik.
   *  - "fade"  : hanya opacity.
   *  - "stack" : satu pengamat untuk blok teks pendek; ANAK-anaknya masuk berurutan.
   *  - "image" : foto/kartu foto terbuka seperti tirai (clip-path) dan foto di dalamnya
   *              mendarat dari skala 1.05; di bawah 640px memakai "rise" biasa.
   */
  variant?: RevealVariant;
  /**
   * Urutan di dalam baris grid: [layar sedang ≥640px, layar lebar ≥1024px]. Jeda =
   * urutan × 70ms. Di bawah 640px (1 kolom) tidak ada jeda karena tiap kartu masuk
   * sendiri-sendiri saat di-scroll. Bila kolom kedua dihilangkan, dipakai nilai pertama.
   */
  stagger?: [md: number, lg?: number];
}

/**
 * Scroll reveal ringan: opacity + translateY, sekali per elemen.
 *
 * Aturan keselamatan (docs/redesign/motion-system.md §3):
 *  - HTML dari server SELALU terlihat. Elemen baru disembunyikan di browser,
 *    sesudah komponen ini aktif, dan hanya bila elemen itu masih di bawah layar.
 *    Jadi tanpa JavaScript, atau bila JS gagal, konten tetap terbaca.
 *  - Elemen yang sudah terlihat saat halaman dibuka TIDAK disembunyikan (tidak
 *    ada kedipan "tampil lalu hilang lalu muncul").
 *  - `prefers-reduced-motion: reduce` atau browser tanpa IntersectionObserver:
 *    tidak disembunyikan sama sekali.
 *  - Animasi hanya sekali; tidak diputar ulang ketika pengguna scroll naik.
 *  - Observer dilepas setelah dipakai dan saat komponen dilepas.
 */
export function Reveal({
  as = "div",
  delay = 0,
  distance,
  variant = "rise",
  stagger,
  className,
  style,
  children,
  ...rest
}: RevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.getAttribute("data-reveal") === "shown") return;
    if (
      typeof window.matchMedia !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    // Sudah terlihat (atau sudah terlewati saat scroll dipulihkan): biarkan tampil.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
      // Jangan pernah meninggalkan elemen tersembunyi bila sudah terlihat.
      if (el.getAttribute("data-reveal") === "hidden") {
        el.setAttribute("data-reveal", "shown");
      }
      return;
    }

    el.setAttribute("data-reveal", "hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.setAttribute("data-reveal", "shown");
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as as React.ElementType;
  const motionVars = {
    ...(delay ? { "--reveal-delay": `${delay}ms` } : null),
    ...(distance ? { "--reveal-distance": `${distance}px` } : null),
    ...(stagger ? { "--i-md": stagger[0] } : null),
    ...(stagger && stagger[1] !== undefined ? { "--i-lg": stagger[1] } : null),
  } as React.CSSProperties;

  return (
    <Tag
      ref={ref}
      data-reveal-variant={variant === "rise" ? undefined : variant}
      className={className}
      style={{ ...motionVars, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
