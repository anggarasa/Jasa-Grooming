import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Search, Sparkles, SlidersHorizontal, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPublicCategories,
  getPublicServices,
} from "@/modules/public/public-services.service";
import { getPublicBusinessProfile } from "@/modules/public/public-business.service";
import { ServiceCard } from "@/components/public/ServiceCard";
import { CategoryFilterPills } from "@/components/public/CategoryFilterPills";
import {
  constructMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo";

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

      {/* Header Banner (Mineral Sage) */}
      <div className="border-b border-[#A2B5A8]/50 bg-[#B4C4B9] py-12 sm:py-16 text-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-xs px-3.5 py-1 text-xs font-bold text-black border border-white">
              <Sparkles className="h-3.5 w-3.5 text-[#15803D]" aria-hidden="true" />
              <span>PAKET PERAWATAN TERLENGKAP</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-black uppercase">
              Katalog Layanan Grooming
            </h1>
            <p className="text-xs sm:text-sm text-black/80 font-medium leading-relaxed">
              Pilih paket perawatan yang disesuaikan dengan ras, ukuran, dan kebutuhan spesifik anabul di {businessName}.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="sticky top-18 z-30 border-b border-[#E2E6DF] bg-white/95 backdrop-blur-md py-4 shadow-2xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex-1 overflow-hidden">
              <CategoryFilterPills
                categories={categories}
                activeCategorySlug={categorySlug}
                totalServicesCount={totalCountAll}
              />
            </div>

            {/* Keyword Search Form */}
            <form
              method="GET"
              action="/services"
              className="flex items-center gap-2 w-full md:w-80 shrink-0"
            >
              {categorySlug && (
                <input type="hidden" name="category" value={categorySlug} />
              )}
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                <Input
                  type="search"
                  name="search"
                  placeholder="Cari nama layanan..."
                  defaultValue={searchQuery || ""}
                  className="pl-9 text-xs h-10 rounded-full border-[#E2E6DF] bg-[#F5F6F3] focus:bg-white text-black"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-black text-white hover:bg-neutral-800 text-xs font-bold h-10 px-4 transition-all shrink-0"
              >
                Cari
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content / Service Cards Grid */}
      <section className="py-10 sm:py-16 bg-[#F5F6F3]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Status Bar */}
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#E2E6DF] text-xs text-slate-500">
            <div>
              Menampilkan{" "}
              <strong className="text-black font-black">{services.length}</strong>{" "}
              layanan
              {activeCategory && (
                <span>
                  {" "}dalam kategori &ldquo;<strong className="text-black">{activeCategory.name}</strong>&rdquo;
                </span>
              )}
              {searchQuery && (
                <span>
                  {" "}dengan kata kunci &ldquo;<strong className="text-black">{searchQuery}</strong>&rdquo;
                </span>
              )}
            </div>

            {(categorySlug || searchQuery) && (
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-slate-600 hover:text-black rounded-full">
                <Link href="/services">
                  <RotateCcw className="h-3 w-3 mr-1" aria-hidden="true" />
                  Reset Filter
                </Link>
              </Button>
            )}
          </div>

          {/* Service Cards List */}
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[26px] border border-dashed border-[#D5DDD3] py-16 px-4 text-center bg-white shadow-2xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E2EAE1] text-[#2D4233] mb-4">
                <SlidersHorizontal className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-base font-black text-black">
                Tidak Ada Layanan yang Cocok
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md">
                Tidak ditemukan layanan yang sesuai dengan filter kategori atau kata kunci pencarian Anda.
              </p>
              <div className="mt-6">
                <Button asChild className="rounded-full bg-black text-white hover:bg-neutral-800 text-xs font-bold" size="sm">
                  <Link href="/services">
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                    Tampilkan Semua Layanan
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
