"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicCategory } from "@/modules/public/public-services.service";

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
    router.push(query ? `/services?${query}` : "/services");
  };

  const isAllActive = !activeCategorySlug;

  return (
    <nav
      className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
      aria-label="Filter Kategori Layanan"
    >
      {/* Tombol Semua Layanan */}
      <button
        type="button"
        onClick={() => handleSelect(undefined)}
        className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          isAllActive
            ? "bg-primary text-primary-foreground shadow-xs"
            : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        aria-pressed={isAllActive}
      >
        <span>Semua Layanan</span>
        <span
          className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
            isAllActive
              ? "bg-primary-hover text-white"
              : "bg-muted text-muted-foreground"
          }`}
        >
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
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? "bg-primary text-primary-foreground shadow-xs"
                : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            aria-pressed={isActive}
          >
            <span>{cat.name}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                isActive
                  ? "bg-primary-hover text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {cat.serviceCount}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
