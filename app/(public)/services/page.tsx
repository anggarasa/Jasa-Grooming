import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowUpRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  getPublicCategories,
  getPublicServices,
} from "@backend/modules/public/public-services.service";
import { getPublicBusinessProfile } from "@backend/modules/public/public-business.service";
import { CategoryFilterPills } from "@/components/public/CategoryFilterPills";
import { PageHero } from "@/components/public/PageHero";
import { ServicePhotoCard } from "@/components/public/ServicePhotoCard";
import { SectionChip } from "@/components/public/home/SectionChip";
import { ServicesCategories } from "@/components/public/services/ServicesCategories";
import { ServicesFlow } from "@/components/public/services/ServicesFlow";
import { ServicesCta } from "@/components/public/services/ServicesCta";
import {
  constructMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/utils";

export const instant = false;

interface ServicesPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const business = await getPublicBusinessProfile();
  const businessName = business?.name || "PawCare Grooming";

  return constructMetadata({
    title: "Katalog Layanan Grooming & Spa",
    description: `Pilihan paket perawatan grooming terbaik untuk anjing dan kucing di ${businessName}. Mandi higienis, potong bulu rapi, dan spa relaksasi.`,
    path: "/services",
    businessName,
  });
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const resolvedParams = await searchParams;
  const categorySlug = resolvedParams?.category?.trim() || undefined;
  const searchQuery = resolvedParams?.search?.trim() || undefined;

  const [categories, services, business] = await Promise.all([
    getPublicCategories(),
    getPublicServices({ categorySlug, search: searchQuery }),
    getPublicBusinessProfile(),
  ]);

  const businessName = business?.name || "PawCare Grooming";
  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const totalCountAll = categories.reduce((sum, c) => sum + c.serviceCount, 0);
  const waNumber = business?.whatsapp || business?.phone;
  const whatsappUrl = waNumber
    ? buildWhatsAppUrl(
        waNumber,
        `Halo ${businessName}, saya ingin bertanya tentang paket layanan grooming.`
      )
    : null;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Beranda", url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}` },
    { name: "Layanan", url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/services` },
  ]);

  return (
    <>
      {/* Schema.org Breadcrumb */}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(breadcrumbJsonLd),
          }}
        />
      )}

      {/* 1-2. Hero */}
      <PageHero
        titleId="services-hero-title"
        eyebrow="Layanan"
        titleLines={["Perawatan Penuh Kasih,", "untuk Anabul Kesayangan."]}
        description="Dari mandi dan styling hingga spa dan perawatan khusus, pilih paket yang sesuai dengan kebutuhan anabul Anda."
        image={{
          src: "/images/hero/pawcare-hero-husky-kucing-tembok-krem.webp",
          alt: "Anjing husky dan kucing abu-abu bergaris di atas tembok krem",
          width: 2000,
          height: 1400,
        }}
        actions={
          <>
            <Link
              href="/booking"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-forest px-6 text-base font-medium text-white transition-colors hover:bg-forest-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
            >
              <span>Booking Sekarang</span>
              <Sparkles className="size-4" aria-hidden="true" />
            </Link>
            <a
              href="#paket"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-base font-medium text-forest ring-1 ring-inset ring-forest transition-colors hover:bg-canvas-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
            >
              <span>Lihat Paket</span>
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </>
        }
      />

      {/* 3. Empat kategori perawatan */}
      <ServicesCategories />

      {/* 4. Daftar paket (data aktual dari database) */}
      <section
        id="paket"
        aria-labelledby="services-list-title"
        className="scroll-mt-4 bg-canvas py-14 sm:py-16 lg:py-[75px]"
      >
        <div className="mx-auto w-full max-w-[1304px] px-4 sm:px-6 lg:px-8">
          <SectionChip>Daftar Paket</SectionChip>
          <h2
            id="services-list-title"
            className="mt-5 text-[length:clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight text-ink"
          >
            Pilih Paket Layanan.
          </h2>
          <p className="mt-3 max-w-[700px] text-base leading-7 text-ink-body sm:text-lg">
            Nama, harga, dan durasi mengikuti data layanan terbaru di {businessName}.
          </p>

          {/* Filter kategori + pencarian */}
          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CategoryFilterPills
              categories={categories}
              activeCategorySlug={categorySlug}
              totalServicesCount={totalCountAll}
            />

            <form
              method="GET"
              action="/services#paket"
              role="search"
              className="flex w-full shrink-0 items-center gap-2 lg:w-[360px]"
            >
              {categorySlug && (
                <input type="hidden" name="category" value={categorySlug} />
              )}
              <div className="relative w-full">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  name="search"
                  aria-label="Cari nama layanan"
                  placeholder="Cari nama layanan..."
                  defaultValue={searchQuery || ""}
                  className="h-11 rounded-full border-0 bg-white pl-10 text-base text-ink ring-1 ring-inset ring-field-border placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-forest"
                />
              </div>
              <button
                type="submit"
                className="h-11 shrink-0 cursor-pointer rounded-full bg-forest px-6 text-[15px] font-medium text-white transition-colors hover:bg-forest-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
              >
                Cari
              </button>
            </form>
          </div>

          {/* Status hasil */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-arch-line! pb-3 text-sm text-ink-body">
            <p role="status">
              Menampilkan{" "}
              <strong className="font-semibold text-ink">{services.length}</strong>{" "}
              layanan
              {activeCategory && (
                <span>
                  {" "}dalam kategori &ldquo;<strong className="font-semibold text-ink">{activeCategory.name}</strong>&rdquo;
                </span>
              )}
              {searchQuery && (
                <span>
                  {" "}dengan kata kunci &ldquo;<strong className="font-semibold text-ink">{searchQuery}</strong>&rdquo;
                </span>
              )}
            </p>

            {(categorySlug || searchQuery) && (
              <Link
                href="/services#paket"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-sm font-medium text-forest underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Reset Filter
              </Link>
            )}
          </div>

          {services.length > 0 ? (
            <ul
              role="list"
              className="mt-8 grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3"
            >
              {services.map((service) => (
                <li key={service.id}>
                  <ServicePhotoCard service={service} showCategory />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-card-xl bg-white px-4 py-14 text-center shadow-float">
              <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-pill-status text-forest">
                <SlidersHorizontal className="size-6" aria-hidden="true" />
              </span>
              <h3 className="text-lg font-semibold text-ink">
                Tidak Ada Layanan yang Cocok
              </h3>
              <p className="mt-1 max-w-md text-[15px] leading-6 text-ink-body">
                Tidak ditemukan layanan yang sesuai dengan filter kategori atau kata kunci pencarian Anda.
              </p>
              <Link
                href="/services#paket"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-forest px-6 text-[15px] font-medium text-white transition-colors hover:bg-forest-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Tampilkan Semua Layanan
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 5. Alur booking */}
      <ServicesFlow />

      {/* 6. CTA booking */}
      <ServicesCta whatsappUrl={whatsappUrl} />
    </>
  );
}
