import * as React from "react";
import type { Metadata } from "next";
import { getPublicBusinessProfile } from "@backend/modules/public/public-business.service";
import { getPublicServices } from "@backend/modules/public/public-services.service";
import { getPublicOperatingHours } from "@backend/modules/public/public-hours.service";
import { getClosedDaysOfWeek } from "@/components/booking/closed-days";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { PageHero } from "@/components/public/PageHero";
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
    description: `Pesan jadwal perawatan grooming untuk anjing dan kucing di ${businessName}. Pilih layanan, tanggal, dan jam yang tersedia secara online.`,
    path: "/booking",
    businessName,
  });
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const resolvedParams = await searchParams;
  const serviceId = resolvedParams?.service?.trim() || undefined;

  const services = await getPublicServices();

  // Hanya untuk menandai hari libur di pilihan tanggal (tampilan). Bila jam tidak
  // terbaca, tidak ada hari yang ditandai dan server tetap menjadi penentu.
  let closedDaysOfWeek: number[] = [];
  try {
    const hours = await getPublicOperatingHours();
    closedDaysOfWeek = getClosedDaysOfWeek(hours.schedule);
  } catch {
    closedDaysOfWeek = [];
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Beranda", url: baseUrl },
    { name: "Reservasi", url: `${baseUrl}/booking` },
  ]);

  return (
    <div className="theme-pawcare">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd),
        }}
      />

      <PageHero
        titleId="booking-hero-title"
        centered
        eyebrow="Reservasi Mandiri Real-Time"
        titleLines={["Reservasi Jadwal Grooming"]}
        description="Pilih layanan, tentukan waktu kunjungan terbaik, dan daftarkan anabul kesayangan Anda secara online."
      />

      {/* Wizard reservasi */}
      <section aria-label="Formulir reservasi" className="bg-canvas pb-14 sm:pb-16 lg:pb-[75px]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <BookingWizard
            services={services}
            initialServiceId={serviceId}
            closedDaysOfWeek={closedDaysOfWeek}
          />
        </div>
      </section>
    </div>
  );
}
