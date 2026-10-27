import * as React from "react";
import type { Metadata } from "next";
import { getPublicBusinessProfile } from "@backend/modules/public/public-business.service";
import { getPublicOperatingHours } from "@backend/modules/public/public-hours.service";
import { getPublicServices } from "@backend/modules/public/public-services.service";
import { getPublicGallery } from "@backend/modules/public/public-gallery.service";
import { HomeHero } from "@/components/public/home/HomeHero";
import { QuoteBand } from "@/components/public/home/QuoteBand";
import {
  HomeServices,
  type HomeServiceData,
} from "@/components/public/home/HomeServices";
import { HomeFeatures } from "@/components/public/home/HomeFeatures";
import { HomeBento } from "@/components/public/home/HomeBento";
import { HomeMoments } from "@/components/public/home/HomeMoments";
import { HomeOutlet } from "@/components/public/home/HomeOutlet";
import {
  constructMetadata,
  buildLocalBusinessJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/utils";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const business = await getPublicBusinessProfile();
  return constructMetadata({
    title: "Perawatan Terbaik untuk Sahabat Berbulu Anda",
    description:
      business?.description ||
      "Layanan pet grooming profesional, higienis, dan terpercaya dengan groomer tersertifikasi untuk anjing dan kucing kesayangan Anda.",
    path: "/",
    businessName: business?.name || "PawCare Grooming",
  });
}

export default async function HomePage() {
  const [business, operatingStatus, services, galleryItems] = await Promise.all([
    getPublicBusinessProfile(),
    getPublicOperatingHours(),
    getPublicServices(),
    getPublicGallery(6),
  ]);

  const businessName = business?.name || "PawCare Grooming";
  const waNumber = business?.whatsapp || business?.phone;
  const whatsappUrl = waNumber
    ? buildWhatsAppUrl(
        waNumber,
        `Halo ${businessName}, saya tertarik untuk memesan layanan grooming untuk anabul kesayangan saya.`
      )
    : null;

  // Hanya field yang dipakai tampilan; harga dan durasi tetap dari database.
  const serviceCards: HomeServiceData[] = services.map((service) => ({
    id: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description,
    shortDescription: service.shortDescription,
    durationMinutes: service.durationMinutes,
    formattedPrice: service.formattedPrice,
    imageObjectKey: service.imageObjectKey,
    category: service.category,
  }));

  const localBusinessJsonLd = buildLocalBusinessJsonLd(
    business,
    operatingStatus.schedule
  );

  return (
    <div className="font-brand">
      {/* Schema.org LocalBusiness Structured Data */}
      {localBusinessJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(localBusinessJsonLd),
          }}
        />
      )}

      {/* A (header) dan I (footer) berada di layout publik bersama. */}

      {/* B. Hero */}
      <HomeHero businessName={businessName} operatingStatus={operatingStatus} />

      {/* C. Banner kutipan: sudut atas menampakkan mint hero, sudut bawah putih */}
      <div className="bg-[linear-gradient(to_bottom,var(--color-canvas)_50%,#fff_50%)]">
        <QuoteBand />
      </div>

      {/* D. Layanan unggulan */}
      <HomeServices services={serviceCards} whatsappUrl={whatsappUrl} />

      {/* E. Keunggulan */}
      <HomeFeatures />

      {/* F. Kategori layanan */}
      <HomeBento />

      {/* G. Galeri / PawCare Moments */}
      <div className="bg-white">
        <HomeMoments items={galleryItems} />
      </div>

      {/* H. Lokasi */}
      <HomeOutlet business={business} operatingStatus={operatingStatus} />
    </div>
  );
}
