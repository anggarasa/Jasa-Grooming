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
  ShieldAlert,
  RefreshCw,
  Info,
  PawPrint,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { ManagedBookingDto } from "@backend/modules/bookings/token.service";
import { PublicBusinessProfile } from "@backend/modules/public/public-business.service";
import {
  formatIDR,
  buildWhatsAppUrl,
  buildCustomerGoogleCalendarUrl,
  cn,
} from "@/lib/utils";

interface BookingConfirmationCardProps {
  /** Reservasi hasil pembacaan server (berdasarkan token). `null` = tidak ditemukan / gagal dimuat. */
  booking: ManagedBookingDto | null;
  /** Kode dari URL; hanya informasi. Yang ditampilkan selalu kode dari reservasi yang dibaca server. */
  bookingCode?: string;
  token?: string;
  business: PublicBusinessProfile | null;
  /** Gangguan saat memuat (bukan token salah): tampilkan "belum dapat dimuat", bukan "tidak ditemukan". */
  loadFailed?: boolean;
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

/** Label status mengikuti istilah yang sudah dipakai aplikasi (halaman kelola & dashboard). */
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu Konfirmasi",
  CONFIRMED: "Terkonfirmasi",
  CHECKED_IN: "Check-in",
  IN_PROGRESS: "Sedang Dikerjakan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  NO_SHOW: "Tidak Hadir",
};

/** Penjelasan status hanya dari arti label itu sendiri; tidak ada janji tambahan. */
const STATUS_NOTE: Record<string, string> = {
  PENDING: "Reservasi Anda menunggu konfirmasi dari salon.",
  CONFIRMED: "Reservasi Anda sudah terkonfirmasi.",
};

const cardClass = "rounded-card-xl bg-white p-5 ring-1 ring-inset ring-border sm:p-6";
const labelClass = "flex items-center gap-1.5 text-[13px] font-medium leading-snug text-ink-muted";
const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";
const primaryButton = cn(buttonBase, "bg-forest text-white hover:bg-forest-hover");
const outlineButton = cn(buttonBase, "bg-white text-forest-ink ring-1 ring-inset ring-forest hover:bg-canvas-tint");

export function BookingConfirmationCard({
  booking,
  token,
  business,
  loadFailed = false,
}: BookingConfirmationCardProps) {
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  const businessName = business?.name || "PawCare Grooming";
  const waNumber = business?.whatsapp || business?.phone;

  /* ---------- Tidak ada reservasi yang bisa dibuktikan: JANGAN tampilkan "berhasil" ---------- */
  if (!booking) {
    const missingToken = !token;
    const helpUrl = buildWhatsAppUrl(
      waNumber,
      `Halo ${businessName}, saya mengalami kendala saat membuka halaman hasil reservasi saya.`
    );
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <div className={cn(cardClass, "space-y-5 p-6 sm:p-8")}>
          <span
            className={cn(
              "mx-auto flex size-16 items-center justify-center rounded-full",
              loadFailed ? "bg-canvas-tint text-forest" : "bg-white text-destructive ring-2 ring-inset ring-destructive"
            )}
          >
            {loadFailed ? <RefreshCw className="size-8" aria-hidden="true" /> : <ShieldAlert className="size-8" aria-hidden="true" />}
          </span>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold leading-snug text-ink">
              {loadFailed ? "Detail Reservasi Belum Dapat Dimuat" : "Reservasi Tidak Ditemukan"}
            </h1>
            <p className="text-[15px] leading-6 text-ink-body sm:text-base">
              {loadFailed
                ? "Terjadi gangguan saat memuat reservasi Anda. Silakan muat ulang halaman ini. Jika Anda baru saja menekan konfirmasi, muat ulang dulu sebelum membuat reservasi baru agar tidak terjadi pemesanan ganda."
                : missingToken
                  ? "Tautan ini tidak lengkap sehingga reservasi tidak dapat ditampilkan. Buka tautan lengkap dari halaman konfirmasi reservasi Anda."
                  : "Tautan ini tidak valid, sudah dicabut, atau sudah kedaluwarsa, sehingga reservasi tidak dapat ditampilkan."}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            {loadFailed && (
              <button type="button" onClick={() => window.location.reload()} className={primaryButton}>
                <RefreshCw className="size-4" aria-hidden="true" />
                <span>Muat Ulang</span>
              </button>
            )}
            {waNumber && (
              <a href={helpUrl} target="_blank" rel="noopener noreferrer" className={loadFailed ? outlineButton : primaryButton}>
                <MessageCircle className="size-4" aria-hidden="true" />
                <span>Bantuan WhatsApp</span>
              </a>
            )}
            {!loadFailed && (
              <Link href="/booking" className={outlineButton}>
                Buat Reservasi Baru
              </Link>
            )}
          </div>
        </div>
        <Link href="/" className="inline-flex min-h-11 items-center text-[15px] font-medium text-forest-ink underline underline-offset-4">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  /* ---------- Reservasi terbukti ada (dibaca server dari token) ---------- */
  const displayCode = booking.bookingCode;
  const manageUrl =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/booking/manage?token=${encodeURIComponent(token)}`
      : `/booking/manage${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopiedCode(true);
      toast.success("Kode Booking Berhasil Disalin", { description: displayCode });
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

  const businessAddress = business?.fullAddress || business?.address || "Jakarta";
  const waUrl = buildWhatsAppUrl(
    waNumber,
    `Halo ${businessName}, saya telah melakukan reservasi online dengan Kode Booking: ${displayCode}. Mohon konfirmasi kedatangan saya.`
  );

  // Link langsung ke Google Calendar customer tanpa login OAuth
  const customerGCalUrl = buildCustomerGoogleCalendarUrl({
    title: `Grooming: ${booking.serviceName} - ${businessName} (${displayCode})`,
    startAt: booking.startAt,
    endAt: booking.endAt,
    durationMinutes: booking.durationMinutes,
    location: `${businessName}, ${businessAddress}`,
    details: `Reservasi Grooming PawCare\nKode Booking: ${displayCode}\nLayanan: ${booking.serviceName}\nAnabul: ${booking.pet?.name || "-"}${booking.pet?.type ? ` (${booking.pet.type})` : ""}\nPemilik: ${booking.customer?.name || "-"}\nTotal Biaya: ${formatIDR(booking.totalPrice)} (Bayar di tempat)\n\nHarap tiba 10 menit sebelum jadwal.`,
  });

  // Judul mengikuti status NYATA. "Berhasil dibuat" hanya untuk reservasi yang masih berjalan
  // (menunggu / terkonfirmasi); status lain (mis. dibatalkan) tidak dirayakan.
  const status = booking.status as string;
  const isActive = status === "PENDING" || status === "CONFIRMED";
  const statusLabel = STATUS_LABEL[status] ?? status;
  const statusNote = STATUS_NOTE[status];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Banner hasil */}
      <div className={cn(cardClass, "space-y-5 p-6 text-center sm:p-8")}>
        <span
          className={cn(
            "mx-auto flex size-16 items-center justify-center rounded-full",
            isActive ? "bg-forest text-white" : "bg-canvas-tint text-forest ring-1 ring-inset ring-border"
          )}
        >
          {isActive ? <CheckCircle2 className="size-9" aria-hidden="true" /> : <Info className="size-8" aria-hidden="true" />}
        </span>

        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full bg-pill-status px-3 py-1 text-[13px] font-semibold leading-snug text-forest-ink">
            {isActive ? "Reservasi Berhasil Dibuat" : `Status Reservasi: ${statusLabel}`}
          </span>
          <h1 className="text-2xl font-semibold leading-snug text-ink sm:text-3xl">
            {isActive ? "Terima Kasih atas Reservasi Anda!" : "Detail Reservasi Anda"}
          </h1>
          <p className="mx-auto max-w-md text-[15px] leading-6 text-ink-body sm:text-base">
            {isActive
              ? "Jadwal perawatan anabul Anda telah tercatat dalam sistem kami."
              : "Berikut rincian reservasi yang tercatat di sistem kami."}
          </p>
        </div>

        {/* Status nyata dari server */}
        <p
          className="flex items-center justify-center gap-2 text-[15px] font-semibold text-forest-ink"
          aria-label={`Status reservasi: ${statusLabel}`}
        >
          <span aria-hidden="true" className="size-2.5 rounded-full bg-forest" />
          <span>Status: {statusLabel}</span>
        </p>
        {statusNote && <p className="-mt-3 text-[15px] leading-6 text-ink-body">{statusNote}</p>}

        {/* Kode booking */}
        <div className="rounded-card-lg bg-canvas-tint p-4 ring-2 ring-inset ring-forest sm:p-5">
          <span className="block text-[13px] font-semibold uppercase leading-none tracking-wide text-forest-ink">
            Kode Booking Resmi
          </span>
          <div className="mt-3 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <span className="break-all font-mono text-2xl font-bold tracking-wider text-forest sm:text-3xl">
              {displayCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Salin kode booking"
              className={cn(outlineButton, "px-4")}
            >
              {copiedCode ? (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" aria-hidden="true" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
          <p className="mt-3 text-[15px] leading-6 text-ink-body">
            Simpan atau tunjukkan kode booking ini saat tiba di lokasi grooming.
          </p>
        </div>

        {/* Tombol Simpan ke Google Calendar khusus Customer (Direct Link tanpa OAuth) */}
        {isActive && (
          <div className="pt-1">
            <a
              href={customerGCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Simpan Jadwal ke Google Calendar"
              className={cn(
                buttonBase,
                "w-full sm:w-auto bg-white text-ink border border-border shadow-xs hover:bg-canvas-tint ring-1 ring-inset ring-border px-5 py-2.5 gap-2.5"
              )}
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
              <ExternalLink className="size-3.5 text-ink-muted" aria-hidden="true" />
            </a>
          </div>
        )}

        <p role="status" className="sr-only">
          {copiedCode ? "Kode booking disalin." : copiedLink ? "Tautan reservasi disalin." : ""}
        </p>
      </div>

      {/* Rincian reservasi (dibaca dari server) */}
      <section aria-labelledby="confirm-details-title" className={cn(cardClass, "space-y-5")}>
        <h2 id="confirm-details-title" className="border-b border-border pb-3 text-lg font-semibold text-ink">
          Rincian Jadwal &amp; Layanan
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <span className={labelClass}>
              <Calendar className="size-4 text-forest" aria-hidden="true" />
              <span>Tanggal Kunjungan</span>
            </span>
            <p className="text-base font-semibold leading-snug text-ink">{formatDateIndo(booking.startAt)}</p>
          </div>
          <div className="space-y-1.5">
            <span className={labelClass}>
              <Clock className="size-4 text-forest" aria-hidden="true" />
              <span>Waktu Sesi &amp; Durasi</span>
            </span>
            <p className="text-base font-semibold leading-snug text-ink">
              {formatTimeOnly(booking.startAt)} WIB ({booking.durationMinutes} Menit)
            </p>
          </div>
          <div className="space-y-1.5">
            <span className={labelClass}>
              <Sparkles className="size-4 text-forest" aria-hidden="true" />
              <span>Paket Layanan</span>
            </span>
            <p className="text-base font-semibold leading-snug text-ink">{booking.serviceName}</p>
          </div>
          <div className="space-y-1.5">
            <span className={labelClass}>
              <Wallet className="size-4 text-forest" aria-hidden="true" />
              <span>Total Biaya (Bayar di Tempat)</span>
            </span>
            <p className="text-xl font-bold leading-snug text-forest">{formatIDR(booking.totalPrice)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 border-t border-border pt-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <span className={labelClass}>
              <PawPrint className="size-4 text-forest" aria-hidden="true" />
              <span>Hewan Peliharaan:</span>
            </span>
            <p className="text-base font-semibold leading-snug text-ink">
              {booking.pet?.name} ({booking.pet?.type})
            </p>
          </div>
          <div className="space-y-1.5">
            <span className={labelClass}>
              <User className="size-4 text-forest" aria-hidden="true" />
              <span>Pemilik:</span>
            </span>
            <p className="break-words text-base font-semibold leading-snug text-ink">
              {booking.customer?.name} ({booking.customer?.phone})
            </p>
          </div>
        </div>
      </section>

      {/* Simpan tautan: satu-satunya cara membuka kembali reservasi */}
      {token && (
        <section aria-labelledby="confirm-manage-title" className="space-y-4 rounded-card-xl bg-canvas-tint p-5 ring-2 ring-inset ring-forest sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-6 shrink-0 text-forest" aria-hidden="true" />
            <div className="space-y-1">
              <h2 id="confirm-manage-title" className="text-lg font-semibold leading-snug text-ink">
                Simpan Tautan Reservasi Anda
              </h2>
              <p className="text-[15px] leading-6 text-ink-body">
                Tautan ini membuka kembali reservasi Anda dan menampilkan status terkininya kapan saja. Simpan atau salin tautan ini sekarang.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={`/booking/manage?token=${encodeURIComponent(token)}`} className={cn(primaryButton, "flex-1")}>
              <span>Buka Halaman Kelola Reservasi</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <button type="button" onClick={handleCopyLink} className={cn(outlineButton, "sm:flex-none")}>
              {copiedLink ? (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  <span>Link Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" aria-hidden="true" />
                  <span>Salin Link Reservasi</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* Lokasi */}
      <section aria-labelledby="confirm-location-title" className={cn(cardClass, "space-y-3")}>
        <h2 id="confirm-location-title" className="flex items-center gap-2 text-lg font-semibold text-ink">
          <MapPin className="size-5 text-forest" aria-hidden="true" />
          <span>Lokasi Salon Grooming</span>
        </h2>
        <p className="text-base font-semibold text-ink">{businessName}</p>
        <p className="text-[15px] leading-6 text-ink-body">{businessAddress}</p>
        {business?.googleMapsUrl && (
          <a
            href={business.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(outlineButton, "w-full sm:w-auto")}
          >
            <span>Buka Petunjuk Arah di Google Maps</span>
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        )}
      </section>

      {/* Aksi cepat */}
      <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        {waNumber && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className={cn(outlineButton, "sm:w-auto")}>
            <MessageCircle className="size-4" aria-hidden="true" />
            <span>Hubungi Salon via WhatsApp</span>
          </a>
        )}
        <Link href="/" className="inline-flex min-h-11 items-center justify-center text-[15px] font-medium text-forest-ink underline underline-offset-4">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
