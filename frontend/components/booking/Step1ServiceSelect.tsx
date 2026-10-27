"use client";

import * as React from "react";
import { Check, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { PublicServiceItem } from "@backend/modules/public/public-services.service";
import { cn, formatIDR } from "@/lib/utils";

/** id elemen status; dipakai tombol "Lanjut" (aria-describedby) di BookingWizard. */
export const SERVICE_STATUS_ID = "booking-service-status";

interface Step1ServiceSelectProps {
  services: PublicServiceItem[];
  selectedServiceId: string | null;
  onSelectService: (service: PublicServiceItem) => void;
}

/**
 * Tahap 1 — Pilih Paket Layanan.
 *
 * Tampilan saja: data (`services`), state pilihan, filter kategori, dan
 * pemanggilan `onSelectService` tidak berubah. Seluruh nama, kategori, durasi,
 * harga, dan deskripsi berasal dari data layanan aktual.
 */
export function Step1ServiceSelect({
  services,
  selectedServiceId,
  onSelectService,
}: Step1ServiceSelectProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  const categories = React.useMemo(() => {
    const map = new Map<string, string>();
    services.forEach((s) => {
      if (s.category?.slug && s.category?.name) {
        map.set(s.category.slug, s.category.name);
      }
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [services]);

  const filteredServices = React.useMemo(() => {
    if (selectedCategory === "all") return services;
    return services.filter((s) => s.category?.slug === selectedCategory);
  }, [services, selectedCategory]);

  const selectedService = React.useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId]
  );

  if (services.length === 0) {
    return (
      <div className="rounded-card-xl bg-white p-10 text-center ring-1 ring-inset ring-border">
        <Sparkles className="mx-auto mb-3 size-8 text-forest" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-ink">
          Belum Ada Layanan Tersedia
        </h3>
        <p className="mt-1 text-[15px] leading-6 text-ink-body">
          Mohon maaf, saat ini belum ada layanan grooming yang aktif untuk dipesan secara online.
        </p>
      </div>
    );
  }

  const chipBase =
    "inline-flex min-h-11 cursor-pointer items-center rounded-full px-5 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2";
  const chipActive = "bg-chip-active text-ink ring-1 ring-inset ring-forest";
  const chipInactive = "bg-chip text-ink-muted hover:bg-chip-active";

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold leading-snug text-ink sm:text-2xl">
          Pilih Paket Layanan Grooming
        </h2>
        <p className="text-[15px] leading-6 text-ink-body">
          Pilih jenis perawatan yang dibutuhkan oleh anabul kesayangan Anda.
        </p>
      </div>

      {/* Filter kategori (hanya bila ada lebih dari satu kategori) */}
      {categories.length > 1 && (
        <div className="flex flex-wrap items-center gap-2.5" role="tablist" aria-label="Filter kategori">
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
            className={cn(chipBase, selectedCategory === "all" ? chipActive : chipInactive)}
          >
            Semua ({services.length})
          </button>
          {categories.map((cat) => {
            const count = services.filter((s) => s.category?.slug === cat.slug).length;
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(cat.slug)}
                className={cn(chipBase, isSelected ? chipActive : chipInactive)}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Daftar paket: 2 kolom di tablet/desktop, 1 kolom di mobile */}
      <div
        role="radiogroup"
        aria-label="Daftar layanan grooming"
        className="grid grid-cols-1 gap-5 md:grid-cols-2"
      >
        {filteredServices.map((service) => {
          const isSelected = selectedServiceId === service.id;

          return (
            <div
              key={service.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onSelectService(service)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onSelectService(service);
                }
              }}
              className={cn(
                "group relative flex cursor-pointer flex-col justify-between rounded-card-lg p-5 text-left transition-[box-shadow,background-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:p-6",
                isSelected
                  ? "bg-canvas-tint shadow-float ring-2 ring-inset ring-forest"
                  : "bg-white ring-1 ring-inset ring-border hover:shadow-float hover:ring-forest/50"
              )}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-pill-status px-3 py-1 text-[13px] font-semibold leading-none text-forest-ink">
                    {service.category?.name || "Grooming"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-chip px-3 py-1 text-[13px] font-medium leading-none text-ink">
                    <Clock className="size-3.5" aria-hidden="true" />
                    <span>{service.durationMinutes} mnt</span>
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-semibold leading-snug text-ink">
                  {service.name}
                </h3>

                <p className="mt-2 line-clamp-3 text-[15px] leading-6 text-ink-body">
                  {service.shortDescription || service.description || "Perawatan intensif dan higienis untuk hewan kesayangan."}
                </p>
              </div>

              <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-4">
                <div>
                  <span className="mb-1 block text-[13px] leading-none text-ink-muted">
                    Biaya Layanan
                  </span>
                  <span className="block text-2xl font-bold leading-none text-forest">
                    {formatIDR(service.price)}
                  </span>
                </div>
                {/* Penanda pilihan: teks + ikon, tidak hanya warna. Status sebenarnya dibaca lewat aria-checked. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
                    isSelected
                      ? "bg-forest text-white"
                      : "bg-white text-forest ring-1 ring-inset ring-forest group-hover:bg-canvas-tint"
                  )}
                >
                  {isSelected && <Check className="size-4" />}
                  {isSelected ? "Terpilih" : "Pilih"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status pilihan: tetap benar walau paket terpilih sedang tersaring oleh filter kategori */}
      <p
        id={SERVICE_STATUS_ID}
        role="status"
        aria-live="polite"
        className={cn(
          "flex items-start gap-2 text-[15px] leading-6",
          selectedService ? "font-medium text-forest-ink" : "text-ink-muted"
        )}
      >
        {selectedService && (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden="true" />
        )}
        <span>
          {selectedService
            ? `Paket terpilih: ${selectedService.name} · ${selectedService.durationMinutes} mnt · ${formatIDR(selectedService.price)}`
            : "Belum ada paket dipilih. Pilih satu paket untuk melanjutkan."}
        </span>
      </p>
    </div>
  );
}
