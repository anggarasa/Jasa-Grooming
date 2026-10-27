import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Home, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan - PawCare Grooming",
  robots: { index: false, follow: false },
};

/**
 * 404 global untuk alamat yang tidak cocok dengan route mana pun (tanpa header
 * dan footer publik, karena berada di luar route group). Gaya sama dengan 404
 * publik.
 */
export default function GlobalNotFound() {
  const focus =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2";
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-16 text-center font-brand">
      <img
        src="/images/brand/logo-pawcare-hijau.png"
        alt="PawCare Grooming"
        width={420}
        height={128}
        className="mb-8 h-14 w-auto"
      />
      <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-forest sm:text-[2.25rem]">
        Halaman Tidak Ditemukan
      </h1>
      <p className="mt-3 max-w-md text-base leading-7 text-ink-body">
        Maaf, alamat yang Anda buka tidak tersedia atau telah berpindah.
      </p>
      <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Link
          href="/"
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-forest px-6 text-base font-medium text-white transition-colors hover:bg-forest-hover ${focus}`}
        >
          <Home className="size-4" aria-hidden="true" />
          Kembali ke Beranda
        </Link>
        <Link
          href="/services"
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-medium text-forest ring-1 ring-inset ring-forest transition-colors hover:bg-canvas-tint ${focus}`}
        >
          <Search className="size-4" aria-hidden="true" />
          Lihat Katalog Layanan
        </Link>
      </div>
    </main>
  );
}
