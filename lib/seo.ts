import type { Metadata } from "next";
import { PublicBusinessProfile } from "@backend/modules/public/public-business.service";
import { PublicServiceItem } from "@backend/modules/public/public-services.service";
import { PublicOperatingHourDay } from "@backend/modules/public/public-hours.service";

const SCHEMA_DAY_MAP: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

/**
 * Serialisasi JSON-LD yang aman dari serangan XSS / script breakout.
 * Menggantikan karakter '<' dan '>' dengan unicode escape sesuai standar OWASP.
 */
export function serializeJsonLd(data: unknown): string {
  if (data === undefined || data === null) {
    return "";
  }
  const serialized = JSON.stringify(data);
  if (!serialized) {
    return "";
  }
  return serialized
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export interface ConstructMetadataOptions {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
  businessName?: string;
}

/**
 * Helper terpusat untuk membangun Next.js Metadata (Canonical, OG, Twitter, Robots)
 */
export function constructMetadata(
  options: ConstructMetadataOptions = {}
): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const {
    title,
    description = "Layanan grooming hewan peliharaan profesional, aman, dan penuh kasih sayang untuk anjing dan kucing kesayangan Anda.",
    path = "",
    ogImage,
    noIndex = false,
    businessName = "PawCare Grooming",
  } = options;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const canonicalUrl = `${baseUrl}${cleanPath === "/" ? "" : cleanPath}`;
  const defaultTitle = `${businessName} | Perawatan Hewan Peliharaan Profesional`;
  const pageTitle = title ? `${title} | ${businessName}` : defaultTitle;
  const imageUrl = ogImage || `${baseUrl}/og-default.png`;

  return {
    title: title ? pageTitle : { default: defaultTitle, template: `%s | ${businessName}` },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: title ? pageTitle : defaultTitle,
      description,
      url: canonicalUrl,
      siteName: businessName,
      locale: "id_ID",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title || businessName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title ? pageTitle : defaultTitle,
      description,
      images: [imageUrl],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

/**
 * Membangun Schema.org LocalBusiness / PetGroomingService JSON-LD
 */
export function buildLocalBusinessJsonLd(
  business: PublicBusinessProfile | null,
  hours?: PublicOperatingHourDay[],
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
) {
  if (!business) return null;

  const openingHoursSpec = (hours || [])
    .filter((h) => h.isOpen)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SCHEMA_DAY_MAP[h.dayOfWeek] || "Monday",
      opens: h.openTime,
      closes: h.closeTime,
    }));

  const logoUrl = business.logoObjectKey
    ? `${baseUrl}/api/media/${business.logoObjectKey}`
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "PetGroomingService",
    name: business.name,
    description: business.description || `Layanan grooming resmi ${business.name}`,
    url: baseUrl,
    telephone: business.phone || business.whatsapp || undefined,
    image: logoUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address || business.fullAddress || undefined,
      addressLocality: business.city || undefined,
      addressRegion: business.province || undefined,
      postalCode: business.postalCode || undefined,
      addressCountry: "ID",
    },
    geo: undefined,
    openingHoursSpecification: openingHoursSpec.length > 0 ? openingHoursSpec : undefined,
    priceRange: "Rp",
  };
}

/**
 * Membangun Schema.org Service JSON-LD untuk detail layanan grooming
 */
export function buildServiceJsonLd(
  service: PublicServiceItem,
  business: PublicBusinessProfile | null,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
) {
  const serviceUrl = `${baseUrl}/services/${encodeURIComponent(service.slug)}`;
  const imageUrl = service.imageObjectKey
    ? `${baseUrl}/api/media/${service.imageObjectKey}`
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.shortDescription || service.description || service.name,
    url: serviceUrl,
    image: imageUrl,
    provider: {
      "@type": "PetGroomingService",
      name: business?.name || "PawCare Grooming",
      url: baseUrl,
    },
    offers: {
      "@type": "Offer",
      price: service.price,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
      url: serviceUrl,
    },
  };
}

/**
 * Membangun Schema.org BreadcrumbList JSON-LD
 */
export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
