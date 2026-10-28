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
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ManagedBookingDto } from "@backend/modules/bookings/token.service";
import { PublicBusinessProfile } from "@backend/modules/public/public-business.service";
import {
  formatIDR,
  buildWhatsAppUrl,
  buildCustomerGoogleCalendarUrl,
  cn,
} from "@/lib/utils";

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
    return `${startStr} - ${endStr} WIB (${durationMinutes} Menit)`;
  } catch {
    return `${durationMinutes} Menit`;
  }
}

function getStatusConfig(status: ManagedBookingDto["status"]) {
  switch (status) {
    case "PENDING":
      return {
        label: "Menunggu Konfirmasi",
        variant: "statusPending" as const,
        dotClass: "bg-status-pending",
      };
    case "CONFIRMED":
      return {
        label: "Terkonfirmasi",
        variant: "statusConfirmed" as const,
        dotClass: "bg-status-confirmed",
      };
    case "CHECKED_IN":
      return {
        label: "Check-In / Hadir",
        variant: "statusCheckedIn" as const,
        dotClass: "bg-status-checked-in",
      };
    case "IN_PROGRESS":
      return {
        label: "Sedang Dikerjakan",
        variant: "statusInProgress" as const,
        dotClass: "bg-status-in-progress",
      };
    case "COMPLETED":
      return {
        label: "Selesai",
        variant: "statusCompleted" as const,
        dotClass: "bg-status-completed",
      };
    case "CANCELLED":
      return {
        label: "Dibatalkan",
        variant: "statusCancelled" as const,
        dotClass: "bg-status-cancelled",
      };
    case "NO_SHOW":
      return {
        label: "Tidak Hadir",
        variant: "statusNoShow" as const,
        dotClass: "bg-status-no-show",
      };
    default:
      return {
        label: status,
        variant: "outline" as const,
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
  const businessAddress = business?.fullAddress || business?.address || "Jakarta";
  const waNumber = business?.whatsapp || business?.phone;
  const waUrl = buildWhatsAppUrl(
    waNumber,
    `Halo ${businessName}, saya ingin menanyakan status reservasi saya dengan Kode Booking: ${booking.bookingCode}.`
  );

  const customerGCalUrl = buildCustomerGoogleCalendarUrl({
    title: `Grooming: ${booking.serviceName} - ${businessName} (${booking.bookingCode})`,
    startAt: booking.startAt,
    endAt: booking.endAt,
    durationMinutes: booking.durationMinutes,
    location: `${businessName}, ${businessAddress}`,
    details: `Reservasi Grooming PawCare\nKode Booking: ${booking.bookingCode}\nLayanan: ${booking.serviceName}\nAnabul: ${booking.pet?.name || "-"}${booking.pet?.type ? ` (${booking.pet.type})` : ""}\nPemilik: ${booking.customer?.name || "-"}\nTotal Biaya: ${formatIDR(booking.totalPrice)} (Bayar di tempat)\n\nHarap tiba 10 menit sebelum jadwal.`,
  });

  const isActive = booking.status !== "CANCELLED" && booking.status !== "NO_SHOW";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header Card with Status Badge */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Reservasi Tamu
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
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
        <div className="rounded-card-xl border border-border bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-muted-foreground block">Kode Reservasi</span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-primary tracking-wider">
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

        {/* Tombol Simpan ke Google Calendar khusus Customer */}
        {isActive && (
          <div className="pt-1">
            <a
              href={customerGCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Simpan Jadwal ke Google Calendar"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-muted/40 transition-colors"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Simpan ke Google Calendar</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>

      {/* Main Reservation Detail Card */}
      <div className="rounded-card-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-5">
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
            <p className="font-bold text-primary text-base">
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
      <div className="rounded-card-xl border border-border bg-card p-5 shadow-xs space-y-2 text-xs">
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
