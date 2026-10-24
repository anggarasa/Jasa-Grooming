import * as React from "react";
import type { Metadata } from "next";
import { Images } from "lucide-react";
import { getPublicGallery } from "@/modules/public/public-gallery.service";
import { getPublicBusinessProfile } from "@/modules/public/public-business.service";
import { GalleryGrid } from "@/components/public/GalleryGrid";
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
  const [galleryItems, business] = await Promise.all([
    getPublicGallery(),
    getPublicBusinessProfile(),
  ]);

  const businessName = business?.name || "PawCare Grooming";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

      {/* Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-secondary/40 via-background to-background py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-subtle px-3 py-1 text-xs font-semibold text-accent">
              <Images className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Dokumentasi Nyata</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
              Galeri Foto &amp; Portofolio
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Momen-momen kebahagiaan anabul setelah dimanjakan dan standar fasilitas higienis di {businessName}.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-12 sm:py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <GalleryGrid items={galleryItems} />
        </div>
      </section>
    </>
  );
}
