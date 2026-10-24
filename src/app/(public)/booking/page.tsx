import * as React from "react";
import type { Metadata } from "next";
import { Calendar } from "lucide-react";
import { getPublicBusinessProfile } from "@/modules/public/public-business.service";
import { getPublicServices } from "@/modules/public/public-services.service";
import { BookingWizard } from "@/components/booking/BookingWizard";
import {
  constructMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo";

export const instant = false;

interface BookingPageProps {
  searchParams: Promise<{
    service?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const business = await getPublicBusinessProfile();
  const businessName = business?.name || "PawCare Grooming";

  return constructMetadata({
    title: `Reservasi Jadwal Grooming - ${businessName}`,
    description: `Pesan jadwal perawatan grooming untuk anjing dan kucing di ${businessName}. Konfirmasi cepat dan slot waktu real-time.`,
    path: "/booking",
    businessName,
  });
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const resolvedParams = await searchParams;
  const serviceId = resolvedParams?.service?.trim() || undefined;

  const services = await getPublicServices();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Beranda", url: baseUrl },
    { name: "Reservasi", url: `${baseUrl}/booking` },
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
      <div className="border-b border-border bg-gradient-to-b from-secondary/40 via-background to-background py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-subtle px-3 py-1 text-xs font-semibold text-accent">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reservasi Mandiri Real-Time</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Reservasi Jadwal Grooming
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
              Pilih layanan, tentukan waktu kunjungan terbaik, dan daftarkan anabul kesayangan Anda dengan konfirmasi instan.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-8 sm:py-12 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <BookingWizard
            services={services}
            initialServiceId={serviceId}
          />
        </div>
      </section>
    </>
  );
}
