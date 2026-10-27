import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicBusinessProfile } from "@backend/modules/public/public-business.service";
import {
  getBookingByGuestToken,
  TokenAuthError,
  ManagedBookingDto,
} from "@backend/modules/bookings/token.service";
import { BookingManageCard } from "@/components/booking/BookingManageCard";
import { constructMetadata } from "@/lib/seo";
import { buildWhatsAppUrl } from "@/lib/utils";

export const instant = false;

interface BookingManagePageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const business = await getPublicBusinessProfile();
  const businessName = business?.name || "PawCare Grooming";

  return constructMetadata({
    title: `Kelola Reservasi - ${businessName}`,
    description: `Portal tamu untuk memeriksa dan mengelola status reservasi grooming Anda.`,
    path: "/booking/manage",
    businessName,
    // Memuat data pribadi pelanggan (diakses lewat token): jangan diindeks.
    noIndex: true,
  });
}

export default async function BookingManagePage({
  searchParams,
}: BookingManagePageProps) {
  const resolvedParams = await searchParams;
  const token = resolvedParams?.token?.trim();

  const business = await getPublicBusinessProfile();
  const businessName = business?.name || "PawCare Grooming";

  if (!token) {
    return (
      <div className="theme-pawcare bg-canvas py-16 sm:py-24">
        <div className="mx-auto max-w-lg px-4 text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Token Akses Diperlukan
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tautan kelola reservasi memerlukan token akses aman yang disertakan pada saat konfirmasi pemesanan.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/booking" className="w-full sm:w-auto">
              <Button type="button" className="w-full text-xs font-semibold">
                Buat Reservasi Baru
              </Button>
            </Link>
            <Link href="/" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full text-xs">
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let booking: ManagedBookingDto | null = null;
  let errorMessage: string | null = null;

  try {
    booking = await getBookingByGuestToken(token);
  } catch (err) {
    if (err instanceof TokenAuthError) {
      errorMessage = err.message;
    } else {
      errorMessage = "Gagal memverifikasi token akses reservasi.";
    }
  }

  if (!booking || errorMessage) {
    const waUrl = buildWhatsAppUrl(
      business?.whatsapp || business?.phone,
      `Halo ${businessName}, saya mengalami kendala saat membuka link kelola reservasi saya.`
    );

    return (
      <div className="theme-pawcare bg-canvas py-16 sm:py-24">
        <div className="mx-auto max-w-lg px-4 text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Reservasi Tidak Ditemukan
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {errorMessage || "Token akses tidak valid atau telah kedaluwarsa."}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button type="button" className="w-full text-xs font-bold flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span>Bantuan WhatsApp</span>
              </Button>
            </a>
            <Link href="/booking" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full text-xs">
                Reservasi Baru
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-pawcare bg-canvas py-10 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <BookingManageCard booking={booking} business={business} />
      </div>
    </div>
  );
}
