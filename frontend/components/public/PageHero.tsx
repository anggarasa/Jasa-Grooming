import * as React from "react";
import { SectionChip } from "@/components/public/home/SectionChip";
import { PawPrintDecor } from "@/components/public/home/decor";

export interface PageHeroImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface PageHeroProps {
  /** Label kecil di atas judul. */
  eyebrow?: string;
  /** Judul (H1). Setiap elemen = satu baris; baris dipisah rapi di semua lebar. */
  titleLines: string[];
  description: string;
  /** Tombol/tautan aksi di bawah deskripsi. */
  actions?: React.ReactNode;
  /** Foto/ilustrasi bertepi transparan di kanan; menempel ke tepi bawah hero. */
  image?: PageHeroImage;
  /** id untuk aria-labelledby. */
  titleId: string;
  /** Teks rata tengah (tanpa gambar); dipakai halaman formulir seperti Booking. */
  centered?: boolean;
  /** Kelas tambahan pembatas lebar gambar, mis. "lg:max-w-[480px]". */
  imageClassName?: string;
}

/**
 * Hero halaman publik: latar mint, teks kiri, gambar di kanan yang menempel ke
 * tepi bawah (dasar tembok pada gambar menjadi "ambang" ke bagian berikutnya).
 * Gaya dan ukuran judul sama dengan hero Beranda. Dipakai ulang oleh halaman
 * publik lain agar konsisten.
 */
export function PageHero({
  eyebrow,
  titleLines,
  description,
  actions,
  image,
  titleId,
  centered = false,
  imageClassName = "",
}: PageHeroProps) {
  return (
    <section aria-labelledby={titleId} className="relative bg-canvas">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <PawPrintDecor className="absolute right-[3%] top-[6%] size-11 rotate-12 text-forest/[0.07]" />
        <PawPrintDecor className="absolute left-[46%] top-[24%] hidden size-9 -rotate-6 text-forest/[0.07] lg:block" />
        <PawPrintDecor className="absolute left-[3%] bottom-[8%] hidden size-10 rotate-6 text-forest/[0.07] lg:block" />
      </div>

      <div
        className={`relative mx-auto grid w-full max-w-[1304px] grid-cols-1 px-4 sm:px-6 lg:px-8 ${
          image
            ? "lg:min-h-[420px] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
            : "lg:min-h-[300px]"
        }`}
      >
        <div
          className={`flex flex-col justify-center py-10 sm:py-14 lg:py-12 lg:pr-6 ${
            centered ? "items-center text-center lg:pr-0" : ""
          }`}
        >
          {eyebrow && (
            <SectionChip className={centered ? "self-center" : "self-start"}>
              {eyebrow}
            </SectionChip>
          )}
          <h1
            id={titleId}
            className={`text-[1.75rem] font-bold leading-[1.33] tracking-tight text-forest sm:text-[2rem] md:text-[2.25rem] xl:text-[2.8rem] ${
              eyebrow ? "mt-5" : ""
            }`}
          >
            {titleLines.map((line, i) => (
              <React.Fragment key={line}>
                {i > 0 && " "}
                <span className="block">{line}</span>
              </React.Fragment>
            ))}
          </h1>
          <p className="mt-5 max-w-[560px] text-base leading-7 text-ink-body sm:text-lg">
            {description}
          </p>
          {actions && (
            <div
              className={`mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap ${
                centered ? "sm:justify-center" : ""
              }`}
            >
              {actions}
            </div>
          )}
        </div>

        {image && (
          <div className="flex items-end justify-center lg:justify-end">
            <img
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              fetchPriority="high"
              decoding="async"
              className={`block h-auto w-full max-w-[420px] sm:max-w-[500px] lg:max-w-[560px] ${imageClassName}`}
            />
          </div>
        )}
      </div>
    </section>
  );
}
