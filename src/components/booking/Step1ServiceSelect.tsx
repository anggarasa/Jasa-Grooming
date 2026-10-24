"use client";

import * as React from "react";
import { Clock, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PublicServiceItem } from "@/modules/public/public-services.service";
import { cn, formatIDR } from "@/lib/utils";

interface Step1ServiceSelectProps {
  services: PublicServiceItem[];
  selectedServiceId: string | null;
  onSelectService: (service: PublicServiceItem) => void;
}

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

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
        <h3 className="text-base font-semibold text-foreground">
          Belum Ada Layanan Tersedia
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Mohon maaf, saat ini belum ada layanan grooming yang aktif untuk dipesan secara online.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Pilih Paket Layanan Grooming
        </h2>
        <p className="text-sm text-muted-foreground">
          Pilih jenis perawatan yang dibutuhkan oleh anabul kesayangan Anda.
        </p>
      </div>

      {/* Category Pills if more than 1 category */}
      {categories.length > 1 && (
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter kategori">
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-border"
            )}
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
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-border"
                )}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Services Grid */}
      <div
        role="radiogroup"
        aria-label="Daftar layanan grooming"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
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
                "group relative flex flex-col justify-between rounded-xl border p-5 text-left transition-all duration-200 cursor-pointer outline-none",
                isSelected
                  ? "border-accent bg-accent-subtle/30 ring-2 ring-accent shadow-xs"
                  : "border-border bg-card hover:border-accent/60 hover:shadow-xs focus-visible:ring-2 focus-visible:ring-accent"
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                      {service.category?.name || "Grooming"}
                    </span>
                    <Badge variant="duration" className="text-[11px] font-medium flex items-center gap-1 py-0.5 px-2">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      <span>{service.durationMinutes} mnt</span>
                    </Badge>
                  </div>
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                      isSelected
                        ? "border-accent bg-accent text-white"
                        : "border-muted-foreground/30 group-hover:border-accent"
                    )}
                    aria-hidden="true"
                  >
                    {isSelected && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                </div>

                <h3 className="mt-2.5 text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {service.name}
                </h3>

                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {service.shortDescription || service.description || "Perawatan intensif dan higienis untuk hewan kesayangan."}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Biaya Layanan</span>
                  <span className="text-base font-black text-primary">
                    {formatIDR(service.price)}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-md transition-colors",
                    isSelected
                      ? "bg-accent text-white"
                      : "text-accent bg-accent-subtle group-hover:bg-accent group-hover:text-white"
                  )}
                >
                  {isSelected ? "Terpilih" : "Pilih"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
