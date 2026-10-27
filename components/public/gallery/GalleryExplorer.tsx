"use client";

import * as React from "react";
import { Images } from "lucide-react";
import { GalleryLightbox } from "@/components/public/GalleryLightbox";
import {
  GALLERY_CATEGORY_LABEL,
  type GalleryCategoryId,
  type GalleryDisplayItem,
} from "@/components/public/gallery/gallery-data";

interface GalleryExplorerProps {
  items: GalleryDisplayItem[];
  /** Hanya kategori yang punya foto; jumlah dihitung di server. */
  categories: { id: GalleryCategoryId; label: string; count: number }[];
}

type Filter = GalleryCategoryId | "all";

/** Banyaknya foto paling atas yang dimuat langsung (sisanya lazy-load). */
const EAGER_COUNT = 3;

/**
 * Galeri editorial: grid kolom (masonry) yang memakai RASIO ASLI tiap foto,
 * sehingga wajah dan objek utama tidak terpotong. Filter kategori menyaring
 * foto yang sudah dimuat (tanpa permintaan jaringan). Lightbox memakai
 * komponen yang sudah ada (Esc, panah, jebakan fokus) dan bernavigasi di dalam
 * hasil filter.
 */
export function GalleryExplorer({ items, categories }: GalleryExplorerProps) {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);
  const lastTriggerId = React.useRef<string | null>(null);

  const visible = React.useMemo(
    () =>
      filter === "all" ? items : items.filter((i) => i.category === filter),
    [items, filter],
  );

  // Setelah lightbox ditutup, kembalikan fokus ke foto yang tadi dibuka.
  React.useEffect(() => {
    if (selectedIdx === null && lastTriggerId.current) {
      const el = document.getElementById(
        `gallery-tile-${lastTriggerId.current}`,
      );
      el?.focus();
      lastTriggerId.current = null;
    }
  }, [selectedIdx]);

  const open = (index: number) => {
    lastTriggerId.current = visible[index].id;
    setSelectedIdx(index);
  };

  const chipBase =
    "inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-5 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2";
  const chipActive = "bg-chip-active text-ink";
  const chipInactive = "bg-chip text-ink-muted hover:bg-chip-active";
  const badge = "rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold";

  const activeLabel = filter === "all" ? null : GALLERY_CATEGORY_LABEL[filter];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card-xl bg-white px-4 py-16 text-center shadow-float">
        <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-pill-status text-forest">
          <Images className="size-7" aria-hidden="true" />
        </span>
        <h3 className="text-lg font-semibold text-ink">
          Belum Ada Foto dalam Galeri
        </h3>
        <p className="mt-1 max-w-sm text-[15px] leading-6 text-ink-body">
          Foto-foto hasil perawatan dan suasana grooming akan segera kami
          publikasikan.
        </p>
      </div>
    );
  }

  return (
    <div>
      {categories.length > 1 && (
        <nav
          aria-label="Filter Kategori Galeri"
          className="flex flex-wrap items-center gap-3"
        >
          <button
            type="button"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
            className={`${chipBase} ${filter === "all" ? chipActive : chipInactive}`}
          >
            <span>Semua</span>
            <span className={badge}>{items.length}</span>
          </button>
          {categories.map((cat) => {
            const active = filter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(cat.id)}
                className={`${chipBase} ${active ? chipActive : chipInactive}`}
              >
                <span>{cat.label}</span>
                <span className={badge}>{cat.count}</span>
              </button>
            );
          })}
        </nav>
      )}

      <p
        role="status"
        aria-live="polite"
        className="mt-6 text-sm text-ink-body"
      >
        Menampilkan{" "}
        <strong className="font-semibold text-ink">{visible.length}</strong>{" "}
        foto
        {activeLabel && (
          <>
            {" "}
            kategori &ldquo;
            <strong className="font-semibold text-ink">{activeLabel}</strong>
            &rdquo;
          </>
        )}
      </p>

      <ul
        role="list"
        className="mt-6 columns-1 gap-5 min-[520px]:columns-2 lg:columns-3"
      >
        {visible.map((item, index) => (
          <li key={item.id} className="mb-5 break-inside-avoid">
            <button
              type="button"
              id={`gallery-tile-${item.id}`}
              onClick={() => open(index)}
              aria-label={`Perbesar ${item.alt} - ${GALLERY_CATEGORY_LABEL[item.category]}${item.caption ? ` ${item.caption}` : ""}`}
              style={{ aspectRatio: `${item.width} / ${item.height}` }}
              className="group relative block w-full cursor-pointer overflow-hidden rounded-card-lg bg-canvas-tint text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
            >
              <img
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                loading={index < EAGER_COUNT ? "eager" : "lazy"}
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span className="absolute inset-x-0 bottom-0 flex flex-col bg-gradient-to-t from-forest-deep/95 via-forest-deep/80 via-55% to-transparent px-4 pb-3 pt-16 text-white opacity-0 transition-opacity duration-200 motion-reduce:transition-none group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/95">
                  {GALLERY_CATEGORY_LABEL[item.category]}
                </span>
                {/* Spasi di DOM (tidak terlihat pada tata letak kolom) agar teks yang terlihat terbaca
                    "Kategori Keterangan" dan cocok dengan nama aksesibel tombol (WCAG 2.5.3). */}
                {item.caption && " "}
                {item.caption && (
                  <span className="mt-0.5 text-base font-medium leading-snug">
                    {item.caption}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <GalleryLightbox
        items={visible}
        currentIndex={selectedIdx}
        onClose={() => setSelectedIdx(null)}
        onNavigate={(next) => {
          lastTriggerId.current = visible[next]?.id ?? lastTriggerId.current;
          setSelectedIdx(next);
        }}
      />
    </div>
  );
}
