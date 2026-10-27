import * as React from "react";
import type { Metadata } from "next";
import { getPublicBusinessProfile } from "@backend/modules/public/public-business.service";
import {
  getBookingByGuestToken,
  TokenAuthError,
  type ManagedBookingDto,
} from "@backend/modules/bookings/token.service";
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
    // Halaman ini memuat data pribadi pelanggan (diakses lewat token): jangan diindeks.
    noIndex: true,
  });
}

/**
 * Halaman hasil reservasi. "Berhasil" hanya ditampilkan bila SERVER menemukan
 * reservasi dari token pada tautan (data dibaca dari database, bukan dari
 * parameter URL). Ada tiga hasil:
 *  - ditemukan            → rincian reservasi nyata;
 *  - token kosong/salah/kedaluwarsa (TokenAuthError) → "Reservasi tidak ditemukan";
 *  - gangguan lain (mis. database) → "Detail belum dapat dimuat" + muat ulang,
 *    bukan klaim berhasil maupun gagal.
 * Memuat ulang halaman memakai tautan yang sama, sehingga data yang tampil konsisten.
 */
export default async function BookingConfirmationPage({
  searchParams,
}: BookingConfirmationPageProps) {
  const resolvedParams = await searchParams;
  const rawCode = resolvedParams?.code?.trim() || "";
  const rawToken = resolvedParams?.token?.trim() || undefined;

  const loadBooking = async (): Promise<{ booking: ManagedBookingDto | null; failed: boolean }> => {
    if (!rawToken) return { booking: null, failed: false };
    try {
      return { booking: await getBookingByGuestToken(rawToken), failed: false };
    } catch (err) {
      // Token kosong/salah/kedaluwarsa = "tidak ditemukan"; selain itu = gangguan memuat.
      return { booking: null, failed: !(err instanceof TokenAuthError) };
    }
  };

  const [business, { booking, failed: loadFailed }] = await Promise.all([
    getPublicBusinessProfile(),
    loadBooking(),
  ]);

  return (
    <div className="theme-pawcare bg-canvas py-10 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <BookingConfirmationCard
          booking={booking}
          bookingCode={booking?.bookingCode || rawCode}
          token={rawToken}
          business={business}
          loadFailed={loadFailed}
        />
      </div>
    </div>
  );
}
