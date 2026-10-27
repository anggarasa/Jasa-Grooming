"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock, MessageCircle } from "lucide-react";
import { SectionChip } from "@/components/public/home/SectionChip";
import { Reveal } from "@/components/public/Reveal";
import {
  ServicePhotoCard,
  type ServicePhotoCardData,
} from "@/components/public/ServicePhotoCard";

/** Data layanan yang dikirim dari server (tanpa field Date agar ringan). */
export type HomeServiceData = ServicePhotoCardData;

interface HomeServicesProps {
  services: HomeServiceData[];
  /** Tautan WhatsApp siap pakai; null bila bisnis tidak punya nomor. */
  whatsappUrl: string | null;
}

/** Referensi menampilkan 5 kartu layanan + 1 kartu ajakan = grid 3×2. */
const MAX_VISIBLE = 5;

function ConsultCard({ whatsappUrl }: { whatsappUrl: string | null }) {
  return (
    <div className="relative flex aspect-[5/6] min-h-[420px] flex-col overflow-hidden rounded-card-xl bg-gradient-to-b from-forest-grad-a to-forest-grad-b p-6 text-white sm:min-h-0">
      <p className="text-sm text-on-deep-muted">Masih Ragu?</p>
      <h3 className="mt-4 text-2xl font-semibold leading-snug">
        Ceritakan Anabul Anda, Kami Bantu Pilih Paketnya.
      </h3>
      <p className="mt-4 text-base leading-7 text-on-deep-muted">
        Ras, kondisi bulu, dan kebiasaannya cukup lewat chat. Gratis, dijawab
        langsung oleh tim kami.
      </p>

      <div className="mt-auto pt-6">
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="motion-press flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-medium text-forest transition-colors hover:bg-pill-status focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-forest-grad-b"
          >
            <span>Konsultasikan Via WhatsApp</span>
            <MessageCircle className="motion-nudge size-4" aria-hidden="true" />
          </a>
        ) : (
          <Link
            href="/booking"
            className="motion-press flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-medium text-forest transition-colors hover:bg-pill-status focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-forest-grad-b"
          >
            <span>Reservasi Sekarang</span>
            <ArrowUpRight className="motion-nudge-ne size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Section D — Layanan unggulan. Data dari `getPublicServices()` (harga, nama,
 * durasi dari database). Chip filter bekerja di tempat: menyaring layanan yang
 * sudah dimuat berdasarkan kategori database, tanpa permintaan jaringan baru.
 */
export function HomeServices({ services, whatsappUrl }: HomeServicesProps) {
  const [activeSlug, setActiveSlug] = React.useState<string | null>(null);
  // Animasi ganti-daftar hanya setelah pengguna benar-benar memilih filter (bukan saat pertama tampil).
  const [filterChanged, setFilterChanged] = React.useState(false);
  const selectCategory = (slug: string | null) => {
    setActiveSlug(slug);
    setFilterChanged(true);
  };

  const categories = React.useMemo(() => {
    const seen = new Map<string, { id: string; name: string; slug: string }>();
    for (const service of services) {
      if (!seen.has(service.category.id)) {
        seen.set(service.category.id, service.category);
      }
    }
    return Array.from(seen.values());
  }, [services]);

  const filtered = activeSlug
    ? services.filter((s) => s.category.slug === activeSlug)
    : services;
  const visible = filtered.slice(0, MAX_VISIBLE);
  const hiddenCount = filtered.length - visible.length;
  const activeCategory = categories.find((c) => c.slug === activeSlug);

  const chipBase =
    "motion-press inline-flex h-11 items-center rounded-full px-6 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2";

  return (
    <section
      aria-labelledby="home-services-title"
      className="bg-white py-14 sm:py-16 lg:py-[75px]"
    >
      <div className="mx-auto w-full max-w-[1304px] px-4 sm:px-6 lg:px-8">
        <Reveal variant="stack">
        <SectionChip>Layanan Terbaik</SectionChip>
        <h2
          id="home-services-title"
          className="mt-5 text-[length:clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight text-ink"
        >
          Perawatan Terbaik Untuk Sahabat Berbulu.
        </h2>
        <p className="mt-3 max-w-[700px] text-base leading-7 text-ink-body sm:text-lg">
          Dari mandi yang menyegarkan hingga grooming menyeluruh, temukan
          perawatan yang bikin si kecil bersih, nyaman, dan makin menggemaskan.
        </p>
        </Reveal>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {categories.length > 1 ? (
            <nav
              className="flex flex-wrap gap-3"
              aria-label="Filter Kategori Layanan"
            >
              <button
                type="button"
                onClick={() => selectCategory(null)}
                aria-pressed={activeSlug === null}
                className={`${chipBase} ${
                  activeSlug === null
                    ? "bg-chip-active text-ink"
                    : "bg-chip text-ink-muted hover:bg-chip-active"
                }`}
              >
                Semua
              </button>
              {categories.map((cat) => {
                const active = activeSlug === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selectCategory(cat.slug)}
                    aria-pressed={active}
                    className={`${chipBase} ${
                      active
                        ? "bg-chip-active text-ink"
                        : "bg-chip text-ink-muted hover:bg-chip-active"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </nav>
          ) : (
            <span aria-hidden="true" />
          )}

          {services.length > 0 && (
            <Link
              href={
                activeSlug
                  ? `/services?category=${encodeURIComponent(activeSlug)}`
                  : "/services"
              }
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm text-base font-medium text-forest underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
            >
              <span>
                {hiddenCount > 0
                  ? `Lihat semua layanan (${filtered.length})`
                  : "Lihat semua layanan"}
              </span>
              <ArrowRight className="motion-nudge size-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {`Menampilkan ${filtered.length} layanan${
            activeCategory ? ` kategori ${activeCategory.name}` : ""
          }`}
        </p>

        {visible.length > 0 ? (
          <ul
            key={activeSlug ?? "semua"}
            role="list"
            className={`mt-9 grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3${
              filterChanged ? " motion-swap" : ""
            }`}
          >
            {visible.map((service, index) => (
              <Reveal
                as="li"
                key={service.id}
                variant="image"
                stagger={[index % 2, index % 3]}
              >
                <ServicePhotoCard service={service} />
              </Reveal>
            ))}
            <Reveal
              as="li"
              variant="image"
              stagger={[visible.length % 2, visible.length % 3]}
            >
              <ConsultCard whatsappUrl={whatsappUrl} />
            </Reveal>
          </ul>
        ) : (
          <div className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="flex min-h-[200px] items-center justify-center rounded-card-xl bg-canvas-tint p-8 text-center lg:col-span-2">
              <p className="text-base text-ink-body">
                Daftar layanan sedang diperbarui oleh pihak manajemen.
              </p>
            </div>
            <ConsultCard whatsappUrl={whatsappUrl} />
          </div>
        )}
      </div>
    </section>
  );
}
