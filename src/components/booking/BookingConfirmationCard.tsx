"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  Clock,
  Sparkles,
  MapPin,
  ExternalLink,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ManagedBookingDto } from "@/modules/bookings/token.service";
import { PublicBusinessProfile } from "@/modules/public/public-business.service";
import { formatIDR, buildWhatsAppUrl } from "@/lib/utils";

interface BookingConfirmationCardProps {
  booking: ManagedBookingDto | null;
  bookingCode: string;
  token?: string;
  business: PublicBusinessProfile | null;
}

function formatDateIndo(isoString: string): string {
  try {
    const dt = new Date(isoString);
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(dt);
  } catch {
    return isoString;
  }
}

function formatTimeOnly(isoString: string): string {
  try {
    const dt = new Date(isoString);
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
      hour12: false,
    }).format(dt);
  } catch {
    return "";
  }
}

export function BookingConfirmationCard({
  booking,
  bookingCode,
  token,
  business,
}: BookingConfirmationCardProps) {
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  const displayCode = booking?.bookingCode || bookingCode;
  const manageUrl = typeof window !== "undefined" && token
    ? `${window.location.origin}/booking/manage?token=${encodeURIComponent(token)}`
    : `/booking/manage${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopiedCode(true);
      toast.success("Kode Booking Berhasil Disalin", {
        description: displayCode,
      });
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Gagal menyalin kode booking");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(manageUrl);
      setCopiedLink(true);
      toast.success("Link Kelola Reservasi Berhasil Disalin");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Gagal menyalin tautan");
    }
  };

  const businessName = business?.name || "PawCare Grooming";
  const businessAddress = business?.fullAddress || business?.address || "Jakarta";
  const waNumber = business?.whatsapp || business?.phone;
  const waUrl = buildWhatsAppUrl(
    waNumber,
    `Halo ${businessName}, saya telah melakukan reservasi online dengan Kode Booking: ${displayCode}. Mohon konfirmasi kedatangan saya.`
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Top Success Banner */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 text-center shadow-sm space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-white shadow-sm">
          <CheckCircle2 className="h-10 w-10 stroke-[2.2]" />
        </div>

        <div className="space-y-1">
          <Badge variant="open" className="text-xs font-semibold px-3 py-1 mb-2">
            Reservasi Berhasil Dibuat
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Terima Kasih atas Reservasi Anda!
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Jadwal perawatan anabul Anda telah tercatat dalam sistem kami.
          </p>
        </div>

        {/* Big Booking Code Display */}
        <div className="mt-4 rounded-2xl border-2 border-dashed border-accent/40 bg-accent-subtle/30 p-4 sm:p-5">
          <span className="text-xs font-bold text-accent uppercase tracking-wider block">
            Kode Booking Resmi
          </span>
          <div className="mt-1 flex items-center justify-center gap-3">
            <span className="font-mono text-2xl sm:text-3xl font-black text-primary tracking-wider">
              {displayCode}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="h-8 px-2.5 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              aria-label="Salin kode booking"
            >
              {copiedCode ? (
                <>
                  <Check className="h-3.5 w-3.5 text-accent" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin</span>
                </>
              )}
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Simpan atau tunjukkan kode booking ini saat tiba di lokasi grooming.
          </p>
        </div>
      </div>

      {/* Booking Details Card if available */}
      {booking && (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-foreground border-b border-border/80 pb-3">
            Rincian Jadwal & Layanan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-accent" />
                <span>Tanggal Kunjungan</span>
              </span>
              <p className="font-bold text-foreground">
                {formatDateIndo(booking.startAt)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-accent" />
                <span>Waktu Sesi & Durasi</span>
              </span>
              <p className="font-bold text-foreground">
                {formatTimeOnly(booking.startAt)} WIB ({booking.durationMinutes} Menit)
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span>Paket Layanan</span>
              </span>
              <p className="font-bold text-foreground">
                {booking.serviceName}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Total Biaya (Bayar di Tempat)</span>
              <p className="font-black text-primary text-base">
                {formatIDR(booking.totalPrice)}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block">Hewan Peliharaan:</span>
              <span className="font-bold text-foreground">
                {booking.pet?.name} ({booking.pet?.type})
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Pemilik:</span>
              <span className="font-bold text-foreground">
                {booking.customer?.name} ({booking.customer?.phone})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Salon Location & Contact Card */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Lokasi Salon Grooming
          </h3>
        </div>
        <p className="text-sm text-foreground font-medium">
          {businessName}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {businessAddress}
        </p>
        {business?.googleMapsUrl && (
          <a
            href={business.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline pt-1"
          >
            <span>Buka Petunjuk Arah di Google Maps</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Guest Management & Share Link Callout */}
      {token && (
        <div className="rounded-2xl border border-border bg-secondary/40 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-bold text-primary">
                Portal Kelola Reservasi Tamu
              </h3>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Anda dapat memeriksa status terkini, rincian reservasi, atau melakukan penyesuaian jadwal kapan saja melalui tautan rahasia tamu Anda.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Link
              href={`/booking/manage?token=${encodeURIComponent(token)}`}
              className="flex-1"
            >
              <Button
                type="button"
                className="w-full text-xs font-bold bg-primary hover:bg-primary/90 text-white"
              >
                <span>Buka Halaman Kelola Reservasi</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-accent" />
                  <span>Link Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin Link Reservasi</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto"
        >
          <Button
            type="button"
            variant="outline"
            className="w-full text-xs font-semibold flex items-center justify-center gap-2 text-foreground"
          >
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            <span>Konfirmasi via WhatsApp</span>
          </Button>
        </a>

        <Link href="/" className="w-full sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
}
