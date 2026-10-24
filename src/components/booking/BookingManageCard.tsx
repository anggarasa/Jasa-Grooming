"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Copy,
  Check,
  MessageCircle,
  HelpCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ManagedBookingDto } from "@/modules/bookings/token.service";
import { PublicBusinessProfile } from "@/modules/public/public-business.service";
import { formatIDR, buildWhatsAppUrl, cn } from "@/lib/utils";

interface BookingManageCardProps {
  booking: ManagedBookingDto;
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

function formatTimeRange(startIso: string, durationMinutes: number): string {
  try {
    const start = new Date(startIso);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const startStr = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
      hour12: false,
    }).format(start);
    const endStr = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
      hour12: false,
    }).format(end);
    return `${startStr} - ${endStr} WIB`;
  } catch {
    return "";
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case "CONFIRMED":
      return {
        variant: "bookingConfirmed" as const,
        label: "Terkonfirmasi",
        dotClass: "bg-badge-booking-confirmed-dot",
      };
    case "PENDING":
      return {
        variant: "bookingPending" as const,
        label: "Menunggu Konfirmasi",
        dotClass: "bg-badge-booking-pending-dot",
      };
    case "IN_PROGRESS":
      return {
        variant: "bookingInProgress" as const,
        label: "Sedang Dikerjakan",
        dotClass: "bg-badge-booking-in-progress-dot",
      };
    case "COMPLETED":
      return {
        variant: "bookingCompleted" as const,
        label: "Selesai",
        dotClass: "bg-badge-booking-completed-dot",
      };
    case "CANCELLED":
      return {
        variant: "bookingCancelled" as const,
        label: "Dibatalkan",
        dotClass: "bg-badge-booking-cancelled-dot",
      };
    default:
      return {
        variant: "outline" as const,
        label: status,
        dotClass: "bg-muted-foreground",
      };
  }
}

export function BookingManageCard({ booking, business }: BookingManageCardProps) {
  const [copiedCode, setCopiedCode] = React.useState(false);

  const statusConfig = getStatusConfig(booking.status);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(booking.bookingCode);
      setCopiedCode(true);
      toast.success("Kode Booking Berhasil Disalin");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Gagal menyalin kode");
    }
  };

  const businessName = business?.name || "PawCare Grooming";
  const waNumber = business?.whatsapp || business?.phone;
  const waUrl = buildWhatsAppUrl(
    waNumber,
    `Halo ${businessName}, saya ingin menanyakan status reservasi saya dengan Kode Booking: ${booking.bookingCode}.`
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header Card with Status Badge */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Reservasi Tamu
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Jadwal Layanan Grooming
            </h1>
          </div>

          {/* Status Badge with Dot */}
          <div className="self-start sm:self-auto">
            <Badge
              variant={statusConfig.variant}
              className="text-xs font-bold py-1.5 px-3 flex items-center gap-2"
            >
              <span className={cn("h-2 w-2 rounded-full", statusConfig.dotClass)} />
              <span>{statusConfig.label}</span>
            </Badge>
          </div>
        </div>

        {/* Big Code Pill */}
        <div className="rounded-2xl border border-border bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-muted-foreground block">Kode Reservasi</span>
            <span className="font-mono text-xl sm:text-2xl font-black text-primary tracking-wider">
              {booking.bookingCode}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            className="self-start sm:self-auto text-xs flex items-center gap-1.5"
          >
            {copiedCode ? (
              <>
                <Check className="h-3.5 w-3.5 text-accent" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Salin Kode</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Reservation Detail Card */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-foreground border-b border-border/80 pb-3">
          Rincian Reservasi
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-accent" />
              <span>Tanggal</span>
            </span>
            <p className="font-bold text-foreground">
              {formatDateIndo(booking.startAt)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-accent" />
              <span>Waktu Sesi</span>
            </span>
            <p className="font-bold text-foreground">
              {formatTimeRange(booking.startAt, booking.durationMinutes)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>Layanan</span>
            </span>
            <p className="font-bold text-foreground">
              {booking.serviceName}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Stasiun Pengerjaan</span>
            <p className="font-bold text-foreground">
              {booking.stationName || "Main Grooming Station"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Total Tagihan</span>
            <p className="font-black text-primary text-base">
              {formatIDR(booking.totalPrice)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Metode Pembayaran</span>
            <p className="font-semibold text-foreground text-xs">
              Bayar di Lokasi (Tunai / QRIS / Debit)
            </p>
          </div>
        </div>

        {/* Pet & Customer Information */}
        <div className="border-t border-border/60 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <span className="font-bold text-foreground uppercase tracking-wider block">
              Data Anabul
            </span>
            <p className="font-semibold text-foreground">
              {booking.pet?.name} ({booking.pet?.type})
            </p>
            {booking.pet?.breed && (
              <p className="text-muted-foreground">Ras: {booking.pet.breed}</p>
            )}
            {booking.pet?.age !== null && booking.pet?.age !== undefined && (
              <p className="text-muted-foreground">Usia: {booking.pet.age} Tahun</p>
            )}
            {booking.pet?.notes && (
              <p className="text-muted-foreground italic rounded-md bg-muted/60 p-2 mt-1">
                &quot;{booking.pet.notes}&quot;
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="font-bold text-foreground uppercase tracking-wider block">
              Data Pemilik
            </span>
            <p className="font-semibold text-foreground">{booking.customer?.name}</p>
            <p className="text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3 text-accent" />
              <span>{booking.customer?.phone}</span>
            </p>
            {booking.customer?.email && (
              <p className="text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span>{booking.customer.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Customer notes if any */}
        {booking.customerNotes && (
          <div className="border-t border-border/60 pt-3 text-xs space-y-1">
            <span className="font-bold text-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-accent" />
              <span>Catatan Reservasi:</span>
            </span>
            <p className="text-muted-foreground bg-muted/40 p-2.5 rounded-lg">
              {booking.customerNotes}
            </p>
          </div>
        )}
      </div>

      {/* Cancellation / Reschedule Policy Note */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-2 text-xs">
        <div className="flex items-center gap-2 text-foreground font-bold">
          <HelpCircle className="h-4 w-4 text-accent" />
          <span>Informasi Perubahan & Bantuan</span>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Jika Anda ingin mengubah jam kedatangan atau memerlukan bantuan khusus untuk anabul Anda, silakan hubungi customer service kami melalui WhatsApp dengan menyertakan kode booking di atas.
        </p>
      </div>

      {/* Fast Help WhatsApp Button */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:flex-1"
        >
          <Button
            type="button"
            className="w-full text-xs font-bold bg-whatsapp hover:bg-whatsapp-hover text-whatsapp-foreground flex items-center justify-center gap-2 shadow-sm"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Bantuan WhatsApp Cepat</span>
          </Button>
        </a>

        <Link href="/" className="w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
}
