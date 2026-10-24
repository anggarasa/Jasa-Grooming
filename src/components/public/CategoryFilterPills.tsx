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
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
      aria-label="Filter Kategori Layanan"
    >
      {/* Tombol Semua Layanan */}
      <button
        type="button"
        onClick={() => handleSelect(undefined)}
        className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black cursor-pointer ${
          isAllActive
            ? "bg-black text-white shadow-2xs"
            : "border border-[#E2E6DF] bg-white text-slate-700 hover:border-black/30 hover:text-black"
        }`}
        aria-pressed={isAllActive}
      >
        <span>Semua Layanan</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
            isAllActive
              ? "bg-white/20 text-white"
              : "bg-[#F3F4F1] text-slate-600"
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
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black cursor-pointer ${
              isActive
                ? "bg-black text-white shadow-2xs"
                : "border border-[#E2E6DF] bg-white text-slate-700 hover:border-black/30 hover:text-black"
            }`}
            aria-pressed={isActive}
          >
            <span>{cat.name}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-[#F3F4F1] text-slate-600"
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
