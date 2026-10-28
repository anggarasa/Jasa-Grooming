"use client";

import * as React from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { PublicGalleryItem } from "@backend/modules/public/public-gallery.service";

/** Item galeri; `src` (opsional) menggantikan jalur /media/<objectKey> untuk foto statis. */
export type LightboxItem = PublicGalleryItem & { src?: string };

interface GalleryLightboxProps {
  items: LightboxItem[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function GalleryLightbox({
  items,
  currentIndex,
  onClose,
  onNavigate,
}: GalleryLightboxProps) {
  const isOpen = currentIndex !== null && currentIndex >= 0 && currentIndex < items.length;
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    // Arahkan fokus ke tombol tutup saat dialog dibuka
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (currentIndex > 0) {
          onNavigate(currentIndex - 1);
        } else {
          onNavigate(items.length - 1);
        }
      } else if (e.key === "ArrowRight") {
        if (currentIndex < items.length - 1) {
          onNavigate(currentIndex + 1);
        } else {
          onNavigate(0);
        }
      } else if (e.key === "Tab") {
        // Focus trap di dalam modal dialog
        if (!dialogRef.current) return;
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, currentIndex, items.length, onClose, onNavigate]);

  if (!isOpen || currentIndex === null) {
    return null;
  }

  const currentItem = items[currentIndex];
  const altText = currentItem.altText || currentItem.caption || `Foto galeri ${currentIndex + 1}`;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate(currentIndex > 0 ? currentIndex - 1 : items.length - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate(currentIndex < items.length - 1 ? currentIndex + 1 : 0);
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Tampilan foto galeri ukuran penuh"
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest-deep/95 p-4 motion-modal"
      onClick={onClose}
    >
      {/* Top Bar: Counter & Close Button */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between text-white z-10 max-w-6xl mx-auto">
        <span className="text-sm font-medium text-white bg-white/10 px-3 py-1.5 rounded-full">
          {currentIndex + 1} / {items.length}
        </span>

        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Tutup pratinjau foto"
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Prev Navigation Button */}
      {items.length > 1 && (
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Foto sebelumnya"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
        </button>
      )}

      {/* Main Image Container */}
      <div
        className="relative max-h-[82vh] max-w-5xl flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentItem.src ?? `/media/${currentItem.objectKey}`}
          alt={altText}
          className="max-h-[75vh] w-auto max-w-full rounded-card-lg object-contain"
        />

        {/* Caption */}
        {currentItem.caption && (
          <div className="mt-3 max-w-2xl text-center">
            <p className="text-base font-medium text-white bg-forest-deep/80 px-4 py-2 rounded-card-lg inline-block">
              {currentItem.caption}
            </p>
          </div>
        )}
      </div>

      {/* Next Navigation Button */}
      {items.length > 1 && (
        <button
          type="button"
          onClick={handleNext}
          aria-label="Foto selanjutnya"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
        >
          <ChevronRight className="h-6 w-6" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
