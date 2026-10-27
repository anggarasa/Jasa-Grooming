"use client";

import * as React from "react";
import { ZoomIn, Images } from "lucide-react";
import { GalleryLightbox, type LightboxItem } from "@/components/public/GalleryLightbox";

interface GalleryGridProps {
  items: LightboxItem[];
}

export function GalleryGrid({ items }: GalleryGridProps) {
  const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card-xl bg-white px-4 py-16 text-center shadow-float">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-pill-status text-forest">
          <Images className="size-7" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-ink">
          Belum Ada Foto dalam Galeri
        </h3>
        <p className="mt-1 max-w-sm text-[15px] leading-6 text-ink-body">
          Foto-foto hasil perawatan dan suasana grooming akan segera kami publikasikan.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => {
          const altText = item.altText || item.caption || `Foto galeri PawCare ${index + 1}`;
          return (
            <div
              key={item.id}
              onClick={() => setSelectedIdx(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedIdx(index);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Perbesar ${altText} - ${item.caption || "Lihat Ukuran Penuh"}`}
              className="group relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-card-lg bg-canvas-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
            >
              <img
                src={item.src ?? `/api/media/${item.objectKey}`}
                alt={altText}
                loading="lazy"
                className="h-full w-full object-cover"
              />

              {/* Hover Dark Overlay with Zoom Icon */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-forest-deep/90 via-forest-deep/30 to-transparent p-4 opacity-0 transition-opacity duration-200 motion-reduce:transition-none group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
                <div className="flex items-center justify-between text-white">
                  {item.caption ? (
                    <span className="text-sm font-medium line-clamp-2">
                      {item.caption}
                    </span>
                  ) : (
                    <span className="text-sm font-medium">Lihat Ukuran Penuh</span>
                  )}
                  <span className="ml-2 shrink-0 rounded-full bg-white/20 p-1.5">
                    <ZoomIn className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <GalleryLightbox
        items={items}
        currentIndex={selectedIdx}
        onClose={() => setSelectedIdx(null)}
        onNavigate={(newIdx) => setSelectedIdx(newIdx)}
      />
    </>
  );
}
