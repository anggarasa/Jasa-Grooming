import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import type { PublicServiceItem } from "@backend/modules/public/public-services.service";
import { resolveServicePhoto } from "@/components/public/home/service-photos";

/** Data layanan yang dipakai kartu (tanpa field Date agar ringan dikirim ke klien). */
export type ServicePhotoCardData = Pick<
  PublicServiceItem,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "shortDescription"
  | "durationMinutes"
  | "formattedPrice"
  | "imageObjectKey"
  | "category"
>;

const FALLBACK_DESCRIPTION =
  "Perawatan grooming berkualitas untuk kebersihan dan kenyamanan hewan kesayangan.";

/**
 * Kartu layanan berlatar foto (desain Beranda), dipakai bersama oleh Beranda
 * dan halaman Layanan. Nama, harga, durasi, dan kategori selalu dari database.
 * Deskripsi + tombol Booking tampil saat hover/fokus (selalu tampil di layar
 * sentuh). Seluruh kartu dapat diklik ke halaman detail.
 */
export function ServicePhotoCard({
  service,
  showCategory = false,
}: {
  service: ServicePhotoCardData;
  /** Tampilkan nama kategori kecil di atas judul (dipakai di halaman Layanan). */
  showCategory?: boolean;
}) {
  const photo = resolveServicePhoto(service.imageObjectKey, service.name);
  const description =
    service.shortDescription || service.description || FALLBACK_DESCRIPTION;
  const detailHref = `/services/${encodeURIComponent(service.slug)}`;

  return (
    <article className="group relative isolate flex aspect-[5/6] min-h-[420px] flex-col justify-end overflow-hidden rounded-card-xl bg-forest-deep text-white sm:min-h-0">
      {photo && (
        <img
          src={photo.src}
          alt={photo.alt}
          width={photo.width ?? undefined}
          height={photo.height ?? undefined}
          loading="lazy"
          decoding="async"
          style={{ objectPosition: photo.objectPosition }}
          className="motion-zoom absolute inset-0 -z-20 h-full w-full object-cover"
        />
      )}
      {/* Lapisan gelap tipis demi keterbacaan teks putih di atas foto */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-deep/92 via-forest-deep/70 via-40% to-transparent to-72%"
      />
      {/* Area klik seluruh kartu (tautan yang sama dengan judul; tidak fokus) */}
      <Link
        href={detailHref}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 z-0"
      />

      <div className="pointer-events-none relative z-10 p-5">
        {showCategory && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-white/95">
            {service.category.name}
          </p>
        )}
        <h3 className="text-2xl font-semibold leading-snug">
          <Link
            href={detailHref}
            className="pointer-events-auto rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-forest-deep"
          >
            {service.name}
          </Link>
        </h3>

        <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-white/90">
          <Clock className="size-3.5" aria-hidden="true" />
          <span>{service.durationMinutes} Menit</span>
        </p>

        {/* Deskripsi dan tombol: tampil saat hover/fokus, selalu tampil di layar sentuh */}
        <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-200 motion-reduce:transition-none group-focus-within:max-h-48 group-focus-within:opacity-100 group-hover:max-h-48 group-hover:opacity-100 [@media(hover:none)]:max-h-48 [@media(hover:none)]:opacity-100">
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/90">
            {description}
          </p>
        </div>

        <p className="mt-3 text-[28px] font-bold leading-none sm:text-3xl">
          {service.formattedPrice}
        </p>

        <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-200 motion-reduce:transition-none group-focus-within:max-h-16 group-focus-within:opacity-100 group-hover:max-h-16 group-hover:opacity-100 [@media(hover:none)]:max-h-16 [@media(hover:none)]:opacity-100">
          <Link
            href={`/booking?service=${encodeURIComponent(service.id)}`}
            className="pointer-events-auto mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-medium text-white ring-1 ring-inset ring-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-forest-deep"
          >
            <span>Booking</span>
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
