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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />

      {/* Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-secondary/40 via-background to-background py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-subtle px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Paket Perawatan Terlengkap</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
              Katalog Layanan Grooming
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Pilih paket perawatan yang disesuaikan dengan ras, ukuran, dan kebutuhan spesifik anabul di {businessName}.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur py-4 shadow-2xs">
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
              className="flex items-center gap-2 w-full md:w-72 shrink-0"
            >
              {categorySlug && (
                <input type="hidden" name="category" value={categorySlug} />
              )}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="search"
                  name="search"
                  placeholder="Cari nama layanan..."
                  defaultValue={searchQuery || ""}
                  className="pl-9 text-xs h-9"
                />
              </div>
              <Button type="submit" size="sm" variant="default" className="text-xs h-9 px-3">
                Cari
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content / Service Cards Grid */}
      <section className="py-10 sm:py-14 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Status Bar */}
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-border/60 text-xs text-muted-foreground">
            <div>
              Menampilkan{" "}
              <strong className="text-foreground font-bold">{services.length}</strong>{" "}
              layanan
              {activeCategory && (
                <span>
                  {" "}dalam kategori &ldquo;<strong className="text-foreground">{activeCategory.name}</strong>&rdquo;
                </span>
              )}
              {searchQuery && (
                <span>
                  {" "}dengan kata kunci &ldquo;<strong className="text-foreground">{searchQuery}</strong>&rdquo;
                </span>
              )}
            </div>

            {(categorySlug || searchQuery) && (
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 px-4 text-center bg-card">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary mb-4">
                <SlidersHorizontal className="h-7 w-7 text-accent" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Tidak Ada Layanan yang Cocok
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                Tidak ditemukan layanan yang sesuai dengan filter kategori atau kata kunci pencarian Anda.
              </p>
              <div className="mt-6">
                <Button asChild variant="accent" size="sm">
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
