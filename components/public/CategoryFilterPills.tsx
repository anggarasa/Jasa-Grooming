"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicCategory } from "@backend/modules/public/public-services.service";

interface CategoryFilterPillsProps {
  categories: PublicCategory[];
  activeCategorySlug?: string;
  totalServicesCount: number;
}

export function CategoryFilterPills({
  categories,
  activeCategorySlug,
  totalServicesCount,
}: CategoryFilterPillsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (slug?: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }

    const query = params.toString();
    // scroll:false → halaman tidak melompat ke atas; daftar paket diperbarui di tempat.
    router.push(query ? `/services?${query}` : "/services", { scroll: false });
  };

  const isAllActive = !activeCategorySlug;

  const chipBase =
    "inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-5 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2";
  const chipActive = "bg-chip-active text-ink";
  const chipInactive = "bg-chip text-ink-muted hover:bg-chip-active";

  return (
    <nav
      className="flex flex-wrap items-center gap-3"
      aria-label="Filter Kategori Layanan"
    >
      {/* Tombol Semua Layanan */}
      <button
        type="button"
        onClick={() => handleSelect(undefined)}
        className={`${chipBase} ${
          isAllActive ? chipActive : chipInactive
        }`}
        aria-pressed={isAllActive}
      >
        <span>Semua Layanan</span>
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold">
          {totalServicesCount}
        </span>
      </button>

      {/* Pill Tiap Kategori */}
      {categories.map((cat) => {
        const isActive = activeCategorySlug === cat.slug;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleSelect(cat.slug)}
            className={`${chipBase} ${isActive ? chipActive : chipInactive}`}
            aria-pressed={isActive}
          >
            <span>{cat.name}</span>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold">
              {cat.serviceCount}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
