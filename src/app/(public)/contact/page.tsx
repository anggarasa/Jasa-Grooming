import * as React from "react";
import type { Metadata } from "next";
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicBusinessProfile } from "@/modules/public/public-business.service";
import { getPublicOperatingHours } from "@/modules/public/public-hours.service";
import { OperatingHoursTable } from "@/components/public/OperatingHoursTable";
import {
  constructMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/utils";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const business = await getPublicBusinessProfile();
  const businessName = business?.name || "PawCare Grooming";

  return constructMetadata({
    title: `Kontak & Lokasi Gerai - ${businessName}`,
    description: `Alamat lengkap, nomor WhatsApp, email, dan jadwal jam operasional mingguan salon hewan ${businessName}.`,
    path: "/contact",
    businessName,
  });
}

export default async function ContactPage() {
  const [business, operatingStatus] = await Promise.all([
    getPublicBusinessProfile(),
    getPublicOperatingHours(),
  ]);

  const businessName = business?.name || "PawCare Grooming";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const fullAddress =
    business?.fullAddress ||
    [business?.address, business?.city, business?.province, business?.postalCode]
      .filter(Boolean)
      .join(", ") ||
    "Jakarta, Indonesia";

  const waNumber = business?.whatsapp || business?.phone;
  const waUrl = buildWhatsAppUrl(
    waNumber,
    `Halo ${businessName}, saya ingin menanyakan informasi lokasi dan booking jadwal grooming.`
  );

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Beranda", url: baseUrl },
    { name: "Kontak", url: `${baseUrl}/contact` },
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
      <div className="border-b border-[#A2B5A8]/50 bg-[#B4C4B9] py-12 sm:py-16 text-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-xs px-3.5 py-1 text-xs font-bold text-black border border-white">
              <Navigation className="h-3.5 w-3.5 text-[#15803D]" aria-hidden="true" />
              <span>LOKASI &amp; JAM KUNJUNGAN</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-black uppercase">
              Kontak &amp; Informasi Gerai
            </h1>
            <p className="text-xs sm:text-sm text-black/80 font-medium leading-relaxed">
              Kunjungi gerai kami atau hubungi tim customer service {businessName} untuk konsultasi reservasi cepat.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-12 sm:py-20 bg-[#F5F6F3]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left: Contact Info Cards */}
            <div className="lg:col-span-5 space-y-6">
              {/* Address Card */}
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
                <h2 className="text-xl font-bold text-foreground">
                  Alamat &amp; Akses Salon
                </h2>

                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0 mt-0.5">
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                        Alamat Gerai
                      </span>
                      <p className="text-sm font-semibold text-foreground mt-0.5 leading-relaxed">
                        {fullAddress}
                      </p>
                    </div>
                  </div>

                  {business?.phone && (
                    <div className="flex items-start gap-3.5">
                      <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0 mt-0.5">
                        <Phone className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                          Telepon Salon
                        </span>
                        <a
                          href={`tel:${business.phone}`}
                          className="text-sm font-semibold text-foreground hover:text-accent mt-0.5 block"
                        >
                          {business.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {business?.email && (
                    <div className="flex items-start gap-3.5">
                      <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0 mt-0.5">
                        <Mail className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                          Email Resmi
                        </span>
                        <a
                          href={`mailto:${business.email}`}
                          className="text-sm font-semibold text-foreground hover:text-accent mt-0.5 block"
                        >
                          {business.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-border space-y-3">
                  {waNumber && (
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-whatsapp hover:bg-whatsapp-hover text-whatsapp-foreground font-bold shadow-xs h-12"
                    >
                      <a href={waUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-5 w-5 mr-2" aria-hidden="true" />
                        Chat via WhatsApp
                      </a>
                    </Button>
                  )}

                  {business?.googleMapsUrl && (
                    <Button asChild variant="outline" size="lg" className="w-full h-12">
                      <a
                        href={business.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />
                        Buka Petunjuk di Google Maps
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Weekly Schedule Table */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Jadwal Operasional Mingguan
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Zona waktu operasional toko: <strong>{operatingStatus.timezone}</strong>
                  </p>
                </div>

                <OperatingHoursTable
                  schedule={operatingStatus.schedule}
                  todayDayOfWeek={operatingStatus.todayHours?.dayOfWeek}
                  isOpenNow={operatingStatus.isOpenNow}
                  statusText={operatingStatus.statusText}
                  showStatusBadge={true}
                />

                <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">
                    💡 Tips Kedatangan:
                  </p>
                  <p>
                    Kami sarankan tiba 10 menit sebelum jam reservasi agar anabul memiliki waktu beradaptasi dengan lingkungan salon.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
