import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getPublicBusinessProfile } from "@backend/modules/public/public-business.service";
import { getPublicGallery } from "@backend/modules/public/public-gallery.service";
import { getPublicCategories } from "@backend/modules/public/public-services.service";
import { getPublicOperatingHours } from "@backend/modules/public/public-hours.service";
import { GalleryGrid } from "@/components/public/GalleryGrid";
import { PageHero } from "@/components/public/PageHero";
import { PageCta } from "@/components/public/PageCta";
import { SectionChip } from "@/components/public/home/SectionChip";
import { summarizeSchedule } from "@/components/public/home/schedule";
import { AboutStory } from "@/components/public/about/AboutStory";
import { AboutValues } from "@/components/public/about/AboutValues";
import {
  buildGalleryItems,
  pickShowcase,
} from "@/components/public/gallery/gallery-data";
import {
  constructMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const business = await getPublicBusinessProfile();
  const businessName = business?.name || "PawCare Grooming";

  return constructMetadata({
    title: `Tentang Kami - Profil & Nilai ${businessName}`,
    description: `Kenali ${businessName}: layanan, nilai yang kami jaga, jam buka, dan lokasi. Perawatan anabul yang nyaman bagi pemilik dan anabul.`,
    path: "/about",
    businessName,
  });
}

export default async function AboutPage() {
  const [business, dbGallery, categories, operatingStatus] = await Promise.all([
    getPublicBusinessProfile(),
    getPublicGallery(),
    getPublicCategories(),
    getPublicOperatingHours(),
  ]);

  const businessName = business?.name || "PawCare Grooming";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Cuplikan foto: hanya foto yang tersedia di galeri (landscape, bergantian antar kategori).
  const showcase = pickShowcase(buildGalleryItems(dbGallery), 6);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Beranda", url: baseUrl },
    { name: "Tentang Kami", url: `${baseUrl}/about` },
  ]);

  const focusClass =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />

      {/* 1. Hero */}
      <PageHero
        titleId="about-hero-title"
        eyebrow="Tentang Kami"
        titleLines={["Lebih dari Sekadar", "Grooming."]}
        description={
          business?.description ||
          `${businessName} menyediakan perawatan grooming untuk anjing dan kucing.`
        }
        image={{
          src: "/images/hero/pawcare-hero-anjing-kucing-tembok-sage.webp",
          alt: "Anak anjing hitam-putih dan anak kucing duduk berdampingan di atas tembok hijau sage",
          width: 2000,
          height: 1710,
        }}
      />

      {/* 2. Cerita dan tujuan (hanya fakta yang tersedia di aplikasi) */}
      <AboutStory
        businessName={businessName}
        city={business?.city || null}
        address={business?.fullAddress || business?.address || null}
        categories={categories
          .filter((c) => c.serviceCount > 0)
          .map((c) => ({ name: c.name, serviceCount: c.serviceCount }))}
        schedule={summarizeSchedule(operatingStatus.schedule)}
      />

      {/* 3. Nilai yang dijaga */}
      <AboutValues />

      {/* 4. Foto (hanya dari galeri; belum ada foto tempat, fasilitas, atau tim) */}
      {showcase.length > 0 && (
        <section
          aria-labelledby="about-gallery-title"
          className="bg-white py-14 sm:py-16 lg:py-[75px]"
        >
          <div className="mx-auto w-full max-w-[1304px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <SectionChip>Galeri</SectionChip>
                <h2
                  id="about-gallery-title"
                  className="mt-5 text-[length:clamp(1.5rem,1.25rem+1vw,2rem)] font-semibold leading-tight text-ink"
                >
                  Sekilas Momen Bersama Anabul
                </h2>
              </div>
              <Link
                href="/gallery"
                className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full px-6 text-[15px] font-medium text-forest ring-1 ring-inset ring-forest transition-colors hover:bg-canvas-tint sm:self-auto ${focusClass}`}
              >
                <span>Buka Galeri Lengkap</span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-8">
              <GalleryGrid items={showcase} />
            </div>
          </div>
        </section>
      )}

      {/* 5. CTA */}
      <PageCta
        titleId="about-cta-title"
        title="Ingin Mengenal Layanan Kami Lebih Dekat?"
        description="Lihat paket perawatan yang tersedia, atau langsung buat reservasi online."
        primary={{ label: "Lihat Layanan", href: "/services" }}
        secondary={{ label: "Booking Sekarang", href: "/booking" }}
      />
    </>
  );
}
