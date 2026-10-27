import * as React from "react";
import type { Metadata } from "next";
import { getPublicGallery } from "@backend/modules/public/public-gallery.service";
import { getPublicBusinessProfile } from "@backend/modules/public/public-business.service";
import { PageHero } from "@/components/public/PageHero";
import { PageCta } from "@/components/public/PageCta";
import { GalleryExplorer } from "@/components/public/gallery/GalleryExplorer";
import {
  availableCategories,
  buildGalleryItems,
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
    title: "Galeri & Portofolio Grooming",
    description: `Koleksi foto hasil perawatan anabul dan kebersihan fasilitas salon modern di ${businessName}.`,
    path: "/gallery",
    businessName,
  });
}

export default async function GalleryPage() {
  const [dbItems, business] = await Promise.all([
    getPublicGallery(),
    getPublicBusinessProfile(),
  ]);

  const businessName = business?.name || "PawCare Grooming";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Foto database (dikelola dari dashboard) + foto pelengkap dari paket aset.
  const items = buildGalleryItems(dbItems);
  const categories = availableCategories(items);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Beranda", url: baseUrl },
    { name: "Galeri", url: `${baseUrl}/gallery` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />

      <PageHero
        titleId="gallery-hero-title"
        eyebrow="Galeri"
        titleLines={["Setiap Sudut Punya Cerita."]}
        description={`Intip hasil perawatan, proses grooming, dan momen manis bersama anabul di ${businessName}.`}
      />

      <section
        aria-label="Foto galeri"
        className="bg-white py-14 sm:py-16 lg:py-[75px]"
      >
        <div className="mx-auto w-full max-w-[1304px] px-4 sm:px-6 lg:px-8">
          <GalleryExplorer items={items} categories={categories} />
        </div>
      </section>

      <PageCta
        titleId="gallery-cta-title"
        title="Siap Merawat Anabul Anda?"
        description="Buat reservasi online sekarang, atau hubungi kami untuk bertanya lebih dulu."
        primary={{ label: "Booking Sekarang", href: "/booking" }}
        secondary={{ label: "Hubungi Kami", href: "/contact" }}
      />
    </>
  );
}
