import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  MessageCircle,
  PawPrint,
  ShieldCheck,
} from "lucide-react";
import {
  getPublicServiceBySlug,
} from "@backend/modules/public/public-services.service";
import { getPublicBusinessProfile } from "@backend/modules/public/public-business.service";
import { ServicePhotoCard } from "@/components/public/ServicePhotoCard";
import { SectionChip } from "@/components/public/home/SectionChip";
import { resolveServicePhoto } from "@/components/public/home/service-photos";
import {
  constructMetadata,
  buildServiceJsonLd,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/utils";

export const instant = false;

interface ServiceDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [service, business] = await Promise.all([
    getPublicServiceBySlug(slug),
    getPublicBusinessProfile(),
  ]);

  if (!service) {
    return constructMetadata({
      title: "Layanan Tidak Ditemukan",
      noIndex: true,
    });
  }

  const businessName = business?.name || "PawCare Grooming";
  const ogImageUrl = service.imageObjectKey
    ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/media/${service.imageObjectKey}`
    : undefined;

  return constructMetadata({
    title: `${service.name} - ${service.category.name}`,
    description:
      service.shortDescription ||
      service.description ||
      `Perawatan ${service.name} di ${businessName}. Durasi ${service.durationMinutes} menit dengan tarif ${service.formattedPrice}.`,
    path: `/services/${encodeURIComponent(service.slug)}`,
    ogImage: ogImageUrl,
    businessName,
  });
}

export default async function ServiceDetailPage({
  params,
}: ServiceDetailPageProps) {
  const { slug } = await params;

  const [service, business] = await Promise.all([
    getPublicServiceBySlug(slug),
    getPublicBusinessProfile(),
  ]);

  if (!service) {
    notFound();
  }

  const businessName = business?.name || "PawCare Grooming";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const waNumber = business?.whatsapp || business?.phone;
  const waUrl = buildWhatsAppUrl(
    waNumber,
    `Halo ${businessName}, saya ingin bertanya dan memesan layanan "${service.name}" (${service.formattedPrice}). Apakah slot tersedia?`
  );

  const photo = resolveServicePhoto(service.imageObjectKey, service.name);

  const serviceJsonLd = buildServiceJsonLd(service, business);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Beranda", url: baseUrl },
    { name: "Layanan", url: `${baseUrl}/services` },
    { name: service.name, url: `${baseUrl}/services/${encodeURIComponent(service.slug)}` },
  ]);

  const focusClass =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2";

  return (
    <>
      {/* Schema.org Structured Data */}
      {serviceJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(serviceJsonLd),
          }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-canvas">
        <div className="mx-auto w-full max-w-[1304px] px-4 py-4 sm:px-6 lg:px-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
            <li>
              <Link
                href="/"
                className={`inline-flex min-h-8 items-center rounded-sm hover:text-forest hover:underline ${focusClass}`}
              >
                Beranda
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
            <li>
              <Link
                href="/services"
                className={`inline-flex min-h-8 items-center rounded-sm hover:text-forest hover:underline ${focusClass}`}
              >
                Layanan
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
            <li
              aria-current="page"
              className="max-w-[16rem] truncate font-medium text-ink sm:max-w-md"
            >
              {service.name}
            </li>
          </ol>
        </div>
      </nav>

      {/* Detail layanan */}
      <article className="bg-canvas pb-14 pt-2 sm:pb-16 lg:pb-[75px]">
        <div className="mx-auto w-full max-w-[1304px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-x-10">
            {/* Foto */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card-xl bg-canvas-tint ring-1 ring-inset ring-arch-line lg:col-span-7 lg:row-start-1">
              {photo ? (
                <img
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width ?? undefined}
                  height={photo.height ?? undefined}
                  fetchPriority="high"
                  decoding="async"
                  style={{ objectPosition: photo.detailObjectPosition }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                  <PawPrint className="mb-3 size-14 text-forest/40" aria-hidden="true" />
                  <span className="text-lg font-semibold text-ink">{service.name}</span>
                  <span className="mt-1 text-sm text-ink-muted">
                    Kategori {service.category.name}
                  </span>
                </div>
              )}
            </div>

            {/* Kartu harga dan aksi */}
            <div className="lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-1 lg:self-start">
              <div className="space-y-6 rounded-card-xl bg-white p-6 shadow-float ring-1 ring-inset ring-black/5 sm:p-8 lg:sticky lg:top-6">
                <div>
                  <SectionChip icon="paw">{service.category.name}</SectionChip>
                  <h1 className="mt-4 text-[1.75rem] font-bold leading-[1.25] tracking-tight text-forest sm:text-[2rem]">
                    {service.name}
                  </h1>
                  <p className="mt-3 text-base leading-7 text-ink-body">
                    {service.shortDescription || service.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-y border-arch-line py-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-pill-status px-4 py-2 text-sm font-medium text-forest-ink">
                    <Clock className="size-4" aria-hidden="true" />
                    <span>Durasi {service.durationMinutes} Menit</span>
                  </span>
                  {service.bufferMinutes > 0 && (
                    <span className="rounded-full bg-chip px-3 py-1.5 text-sm text-ink-muted">
                      +{service.bufferMinutes}m buffer waktu
                    </span>
                  )}
                </div>

                <div>
                  <span className="block text-sm font-medium text-ink-muted">
                    Tarif Layanan
                  </span>
                  <div className="mt-1 text-4xl font-bold tracking-tight text-forest">
                    {service.formattedPrice}
                  </div>
                  <span className="mt-1 block text-sm text-ink-muted">
                    *Harga sudah termasuk seluruh tahapan mandi dan sanitasi dasar
                  </span>
                </div>

                <div className="space-y-3">
                  <Link
                    href={`/booking?service=${encodeURIComponent(service.id)}`}
                    className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-forest px-6 text-base font-medium text-white transition-colors hover:bg-forest-hover ${focusClass}`}
                  >
                    <Calendar className="size-5" aria-hidden="true" />
                    <span>Booking Layanan Ini</span>
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>

                  {waNumber && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-base font-medium text-forest ring-1 ring-inset ring-forest transition-colors hover:bg-canvas-tint ${focusClass}`}
                    >
                      <MessageCircle className="size-5" aria-hidden="true" />
                      <span>Tanya via WhatsApp</span>
                    </a>
                  )}
                </div>

                <div className="text-center">
                  <Link
                    href="/services"
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[15px] font-medium text-forest underline-offset-4 hover:underline ${focusClass}`}
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Kembali ke Katalog Layanan
                  </Link>
                </div>
              </div>
            </div>

            {/* Jaminan standar (teks lama aplikasi; klaim belum dikonfirmasi pemilik, K-05) */}
            <div className="rounded-card-lg bg-canvas-tint p-6 ring-1 ring-inset ring-arch-line lg:col-span-7">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <ShieldCheck className="size-5 text-forest" aria-hidden="true" />
                <span>Jaminan Standar Higienis PawCare</span>
              </h2>
              <ul
                className="mt-4 grid grid-cols-1 gap-3 text-[15px] leading-6 text-ink-body sm:grid-cols-2"
                role="list"
              >
                {[
                  "Sterilisasi UV alat sebelum dan sesudah",
                  "Sampo hypoallergenic aman di mata",
                  "Pengeringan suhu adaptif bebas stres",
                  "Groomer tersertifikasi penyayang hewan",
                ].map((text) => (
                  <li key={text} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden="true" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Deskripsi lengkap */}
            <div className="rounded-card-lg bg-white p-6 shadow-float ring-1 ring-inset ring-black/5 lg:col-span-7">
              <h2 className="text-lg font-semibold text-ink">Deskripsi Lengkap Layanan</h2>
              <div className="mt-3 whitespace-pre-line text-base leading-7 text-ink-body">
                {service.fullDescription ||
                  service.description ||
                  "Paket grooming ini mencakup perawatan higienis menyeluruh untuk kesehatan kulit, kebersihan telinga, perapian kuku, serta styling bulu agar anabul tampil segar dan nyaman."}
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Layanan terkait */}
      {service.relatedServices && service.relatedServices.length > 0 && (
        <section
          aria-labelledby="related-services-title"
          className="bg-white py-14 sm:py-16 lg:py-[75px]"
        >
          <div className="mx-auto w-full max-w-[1304px] px-4 sm:px-6 lg:px-8">
            <SectionChip>Pilihan Serupa</SectionChip>
            <h2
              id="related-services-title"
              className="mt-5 text-[length:clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight text-ink"
            >
              Layanan Terkait dalam Kategori Ini
            </h2>

            <ul
              role="list"
              className="mt-8 grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3"
            >
              {service.relatedServices.map((rel) => (
                <li key={rel.id}>
                  <ServicePhotoCard service={rel} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
