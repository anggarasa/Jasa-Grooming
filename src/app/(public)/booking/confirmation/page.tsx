import * as React from "react";
import type { Metadata } from "next";
import { getPublicBusinessProfile } from "@/modules/public/public-business.service";
import { getBookingByGuestToken } from "@/modules/bookings/token.service";
import { BookingConfirmationCard } from "@/components/booking/BookingConfirmationCard";
import { constructMetadata } from "@/lib/seo";

export const instant = false;

interface BookingConfirmationPageProps {
  searchParams: Promise<{
    code?: string;
    token?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const business = await getPublicBusinessProfile();
  const businessName = business?.name || "PawCare Grooming";

  return constructMetadata({
    title: `Konfirmasi Reservasi - ${businessName}`,
    description: `Bukti konfirmasi reservasi grooming anabul Anda di ${businessName}.`,
    path: "/booking/confirmation",
    businessName,
  });
}

export default async function BookingConfirmationPage({
  searchParams,
}: BookingConfirmationPageProps) {
  const resolvedParams = await searchParams;
  const rawCode = resolvedParams?.code?.trim() || "";
  const rawToken = resolvedParams?.token?.trim() || undefined;

  const [business, booking] = await Promise.all([
    getPublicBusinessProfile(),
    rawToken
      ? getBookingByGuestToken(rawToken).catch(() => null)
      : Promise.resolve(null),
  ]);

  const displayCode = booking?.bookingCode || rawCode || "GRM-JADWAL";

  return (
    <div className="py-10 sm:py-16 bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <BookingConfirmationCard
          booking={booking}
          bookingCode={displayCode}
          token={rawToken}
          business={business}
        />
      </div>
    </div>
  );
}
