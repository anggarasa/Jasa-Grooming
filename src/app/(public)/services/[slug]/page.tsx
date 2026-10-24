import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Clock,
  Sparkles,
  ArrowLeft,
  MessageCircle,
  ShieldCheck,
  Check,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getPublicServiceBySlug,
} from "@/modules/public/public-services.service";
import { getPublicBusinessProfile } from "@/modules/public/public-business.service";
import { ServiceCard } from "@/components/public/ServiceCard";
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

  const serviceJsonLd = buildServiceJsonLd(service, business);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Beranda", url: baseUrl },
    { name: "Layanan", url: `${baseUrl}/services` },
    { name: service.name, url: `${baseUrl}/services/${encodeURIComponent(service.slug)}` },
  ]);

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

      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="border-b border-border bg-muted/30 py-3.5"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ol className="flex items-center gap-2 text-xs text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                Beranda
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/services" className="hover:text-foreground transition-colors">
                Layanan
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-semibold text-foreground truncate max-w-xs sm:max-w-md">
              {service.name}
            </li>
          </ol>
        </div>
      </nav>

      {/* Main Service Details Section */}
      <article className="py-10 sm:py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left: Cover Photo / Media Gallery */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-border bg-muted shadow-md">
                {service.imageObjectKey ? (
                  <img
                    src={`/api/media/${service.imageObjectKey}`}
                    alt={`Foto layanan ${service.name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-secondary to-muted p-8 text-center">
                    <Sparkles className="h-16 w-16 text-accent mb-3" aria-hidden="true" />
                    <span className="text-base font-bold text-foreground">
                      {service.name}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Kategori {service.category.name}
                    </span>
                  </div>
                )}

                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center rounded-full bg-black/70 backdrop-blur-sm px-3.5 py-1 text-xs font-semibold text-white shadow-xs">
                    {service.category.name}
                  </span>
                </div>
              </div>

              {/* Service Highlights Box */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent" aria-hidden="true" />
                  <span>Jaminan Standar Higienis PawCare</span>
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-muted-foreground" role="list">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Sterilisasi UV alat sebelum dan sesudah</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Sampo hypoallergenic aman di mata</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Pengeringan suhu adaptif bebas stres</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Groomer tersertifikasi penyayang hewan</span>
                  </li>
                </ul>
              </div>

              {/* Full Description */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
                <h2 className="text-base font-bold text-foreground">
                  Deskripsi Lengkap Layanan
                </h2>
                <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
                  {service.fullDescription ||
                    service.description ||
                    "Paket grooming ini mencakup perawatan higienis menyeluruh untuk kesehatan kulit, kebersihan telinga, perapian kuku, serta styling bulu agar anabul tampil segar dan nyaman."}
                </div>
              </div>
            </div>

            {/* Right: Price Card & Booking Actions (Sticky) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-lg space-y-6">
                <div>
                  <Badge variant="outline" className="text-xs font-semibold mb-2">
                    {service.category.name}
                  </Badge>
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                    {service.name}
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {service.shortDescription || service.description}
                  </p>
                </div>

                {/* Duration & Buffer */}
                <div className="flex flex-wrap items-center gap-3 py-3 border-y border-border/80">
                  <Badge
                    variant="duration"
                    className="text-xs font-semibold py-1 px-3 flex items-center gap-1.5"
                  >
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Durasi {service.durationMinutes} Menit</span>
                  </Badge>

                  {service.bufferMinutes > 0 && (
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                      +{service.bufferMinutes}m buffer waktu
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Tarif Layanan
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-primary tracking-tight mt-1">
                    {service.formattedPrice}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    *Harga sudah termasuk seluruh tahapan mandi dan sanitasi dasar
                  </span>
                </div>

                {/* CTAs */}
                <div className="space-y-3 pt-2">
                  <Button
                    asChild
                    size="lg"
                    variant="accent"
                    className="w-full font-bold text-base h-12 shadow-md"
                  >
                    <Link href={`/booking?service=${encodeURIComponent(service.id)}`}>
                      <Calendar className="h-5 w-5 mr-2 text-white" aria-hidden="true" />
                      Booking Layanan Ini
                    </Link>
                  </Button>

                  {waNumber && (
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-whatsapp hover:bg-whatsapp-hover text-whatsapp-foreground font-bold h-12 shadow-xs"
                    >
                      <a href={waUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-5 w-5 mr-2" aria-hidden="true" />
                        Tanya via WhatsApp
                      </a>
                    </Button>
                  )}
                </div>

                <div className="pt-2 text-center">
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Kembali ke Katalog Layanan
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Related Services */}
          {service.relatedServices && service.relatedServices.length > 0 && (
            <div className="mt-16 sm:mt-24 pt-12 border-t border-border">
              <div className="mb-8 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  Pilihan Serupa
                </span>
                <h2 className="text-2xl font-black text-foreground">
                  Layanan Terkait dalam Kategori Ini
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {service.relatedServices.map((rel) => (
                  <ServiceCard key={rel.id} service={rel} />
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
