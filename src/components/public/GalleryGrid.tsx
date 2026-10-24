"use client";

import * as React from "react";
import { ZoomIn, Images } from "lucide-react";
import { PublicGalleryItem } from "@/modules/public/public-gallery.service";
import { GalleryLightbox } from "@/components/public/GalleryLightbox";

interface GalleryGridProps {
  items: PublicGalleryItem[];
}

export function GalleryGrid({ items }: GalleryGridProps) {
  const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
          <Images className="h-7 w-7" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          Belum Ada Foto dalam Galeri
        </h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Foto-foto hasil perawatan dan suasana grooming akan segera kami publikasikan.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
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
              aria-label={`Perbesar ${altText}`}
              className="group relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-muted shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <img
                src={`/api/media/${item.objectKey}`}
                alt={altText}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Hover Dark Overlay with Zoom Icon */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="flex items-center justify-between text-white">
                  {item.caption ? (
                    <span className="text-xs font-medium line-clamp-2">
                      {item.caption}
                    </span>
                  ) : (
                    <span className="text-xs font-medium">Lihat Ukuran Penuh</span>
                  )}
                  <span className="rounded-full bg-white/20 p-1.5 backdrop-blur-xs ml-2 shrink-0">
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
