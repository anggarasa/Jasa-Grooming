"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublicGalleryItem } from "@backend/modules/public/public-gallery.service";
import { GalleryLightbox } from "@/components/public/GalleryLightbox";
import { SectionChip } from "@/components/public/home/SectionChip";
import { Reveal } from "@/components/public/Reveal";
import { PawPrintDecor } from "@/components/public/home/decor";

interface HomeMomentsProps {
  items: PublicGalleryItem[];
}

/** Referensi: 1 foto besar + 4 foto kecil. */
const MAX_ITEMS = 5;

/**
 * Posisi crop untuk foto galeri bawaan seed (usulan; diverifikasi saat QA).
 * Foto yang diunggah admin memakai posisi tengah-atas.
 */
const OBJECT_POSITION_BY_KEY: Record<string, string> = {
  "gallery/images/dog-poodle-groom.webp": "50% 30%",
  "gallery/images/cat-persian-groom.webp": "50% 45%",
  "gallery/images/salon-facility.webp": "50% 55%",
  "gallery/images/dog-bath-fun.webp": "60% 40%",
};

function positionFor(objectKey: string) {
  return OBJECT_POSITION_BY_KEY[objectKey] ?? "50% 40%";
}

/**
 * Pada kolom kanan (grid 2 kolom × 2 baris), jumlah foto kecil bisa kurang
 * dari 4 (database tidak selalu punya 5 foto). Foto terakhir diperlebar agar
 * tidak ada lubang di grid.
 */
function smallTileClass(index: number, total: number) {
  if (total === 1) return "col-span-2 row-span-2";
  if (total === 2) return "col-span-2";
  if (total === 3 && index === 2) return "col-span-2";
  return "";
}

export function HomeMoments({ items }: HomeMomentsProps) {
  const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);

  const shown = items.slice(0, MAX_ITEMS);
  const [featured, ...rest] = shown;

  const altFor = (item: PublicGalleryItem, index: number) =>
    item.altText || item.caption || `Foto galeri PawCare ${index + 1}`;

  const renderTile = (
    item: PublicGalleryItem,
    index: number,
    className: string
  ) => {
    const alt = altFor(item, index);
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setSelectedIdx(index)}
        aria-label={`Perbesar ${alt}${item.caption ? ` - ${item.caption}` : ""}`}
        className={`group relative isolate block overflow-hidden rounded-card-lg bg-forest-deep-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-forest-deep ${className}`}
      >
        <img
          src={`/media/${item.objectKey}`}
          alt={alt}
          loading="lazy"
          decoding="async"
          style={{ objectPosition: positionFor(item.objectKey) }}
          className="motion-zoom absolute inset-0 h-full w-full object-cover"
        />
        {item.caption && (
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-deep/90 to-transparent px-4 pb-3 pt-10 text-sm font-medium text-white opacity-0 transition-opacity duration-200 motion-reduce:transition-none group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
            {item.caption}
          </span>
        )}
      </button>
    );
  };

  return (
    <section
      aria-labelledby="home-moments-title"
      className="relative overflow-hidden rounded-band bg-forest-deep px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-[60px]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <PawPrintDecor className="absolute -left-12 top-[3%] size-56 -rotate-12 text-forest-deep-2" />
        <PawPrintDecor className="absolute right-[-3%] bottom-[2%] size-60 rotate-12 text-forest-deep-2" />
        <PawPrintDecor className="absolute left-[36%] top-[22%] hidden size-20 rotate-6 text-forest-deep-2 lg:block" />
        <PawPrintDecor className="absolute left-[8%] bottom-[-3%] hidden size-28 text-forest-deep-2 md:block" />
      </div>

      <div className="relative mx-auto w-full max-w-[1240px]">
        <Reveal variant="stack" className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[880px]">
            <SectionChip onDark>PawCare Moments</SectionChip>
            <h2
              id="home-moments-title"
              className="mt-5 text-[length:clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight text-white"
            >
              Lebih Dekat Dengan Dunia PawCare.
            </h2>
            <p className="mt-3 text-base leading-7 text-white sm:text-lg">
              Dari suasana tempat yang nyaman hingga momen manis bersama anabul,
              intip cerita dan keseharian yang membuat PawCare terasa istimewa.
            </p>
          </div>

          <Link
            href="/gallery"
            className="motion-press inline-flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full px-6 text-[15px] font-medium text-white ring-1 ring-inset ring-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-forest-deep lg:self-end"
          >
            <span>Lihat Semua Momen</span>
            <ArrowRight className="motion-nudge size-4" aria-hidden="true" />
          </Link>
        </Reveal>

        {featured && (
          <Reveal variant="image" className="mt-9 grid grid-cols-1 gap-7 lg:mt-12 lg:grid-cols-[540px_minmax(0,1fr)] lg:gap-10">
            {renderTile(featured, 0, "aspect-[540/468] w-full lg:aspect-auto lg:h-[468px]")}

            {rest.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:gap-7 lg:h-[468px] lg:grid-rows-2">
                {rest.map((item, i) =>
                  renderTile(
                    item,
                    i + 1,
                    `aspect-[316/220] w-full lg:aspect-auto lg:h-full ${smallTileClass(i, rest.length)}`
                  )
                )}
              </div>
            )}
          </Reveal>
        )}
      </div>

      <GalleryLightbox
        items={shown}
        currentIndex={selectedIdx}
        onClose={() => setSelectedIdx(null)}
        onNavigate={(next) => setSelectedIdx(next)}
      />
    </section>
  );
}
