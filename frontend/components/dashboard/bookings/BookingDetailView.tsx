"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookingStatus } from "@prisma/client";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  PawPrint,
  Scissors,
  FileText,
  AlertTriangle,
  History,
  CheckCircle2,
  CalendarClock,
  Ban,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import {
  formatIndonesianDate,
  formatIndonesianTime,
  formatIndonesianTimeRange,
} from "@/lib/format-date";
import { formatIDR, buildWhatsAppUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BookingStatusBadge,
  BookingSourceBadge,
  STATUS_LABELS,
  getBookingSourceLabel,
} from "./BookingStatusBadge";
import { RescheduleModal } from "./RescheduleModal";
import { CancelModal } from "./CancelModal";
import { StatusTransitionModal } from "./StatusTransitionModal";
import { InternalNotesForm } from "./InternalNotesForm";
import {
  AdminBookingDetailItem,
  BookingRescheduleHistoryItem,
  BookingStatusHistoryItem,
} from "@backend/modules/bookings/admin-ui.types";

interface BookingDetailViewProps {
  initialBooking: AdminBookingDetailItem;
}

export function BookingDetailView({ initialBooking }: BookingDetailViewProps) {
  const router = useRouter();
  const [booking, setBooking] = React.useState<AdminBookingDetailItem>(initialBooking);

  // Modals state
  const [isRescheduleOpen, setIsRescheduleOpen] = React.useState(false);
  const [isCancelOpen, setIsCancelOpen] = React.useState(false);
  const [statusModalTarget, setStatusModalTarget] = React.useState<BookingStatus | null>(null);

  // Reload data
  const reloadData = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setBooking(json.data);
      }
    } catch {
      router.refresh();
    }
  }, [booking.id, router]);

  const isTerminal =
    booking.status === BookingStatus.COMPLETED ||
    booking.status === BookingStatus.CANCELLED ||
    booking.status === BookingStatus.NO_SHOW;

  const dateStr = formatIndonesianDate(booking.startAt, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const startTimeStr = formatIndonesianTime(booking.startAt);
  const timeRangeStr = formatIndonesianTimeRange(booking.startAt, booking.endAt);
  const dateOnlyJakarta = React.useMemo(() => {
    if (!booking.startAt) return "";
    const dt = typeof booking.startAt === "string" ? new Date(booking.startAt) : booking.startAt;
    if (isNaN(dt.getTime())) return "";
    return new Date(dt.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  }, [booking.startAt]);

  const waUrl = buildWhatsAppUrl(
    booking.customer?.phone,
    `Halo ${booking.customer?.name}, kami dari PawCare Grooming mengenai reservasi #${booking.bookingCode} untuk ${booking.pet?.name}.`
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Link href="/dashboard/bookings">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Kembali
              </Link>
            </Button>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              #{booking.bookingCode}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Reservasi #{booking.bookingCode}
            </h1>
            <BookingStatusBadge status={booking.status} />
            <BookingSourceBadge source={booking.source} />
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp Direct Action */}
          {booking.customer?.phone && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="motion-admin-press rounded-full"
            >
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-1.5" />
                WhatsApp Pelanggan
              </a>
            </Button>
          )}

          {/* Status Transitions */}
          {!isTerminal && (
            <>
              {booking.status === BookingStatus.PENDING && (
                <Button
                  size="sm"
                  onClick={() => setStatusModalTarget(BookingStatus.CONFIRMED)}
                  className="motion-admin-press rounded-full"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Konfirmasi
                </Button>
              )}

              {booking.status === BookingStatus.CONFIRMED && (
                <Button
                  size="sm"
                  onClick={() => setStatusModalTarget(BookingStatus.CHECKED_IN)}
                  className="motion-admin-press rounded-full"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Tandai Check-in
                </Button>
              )}

              {booking.status === BookingStatus.CHECKED_IN && (
                <Button
                  size="sm"
                  onClick={() => setStatusModalTarget(BookingStatus.IN_PROGRESS)}
                  className="motion-admin-press rounded-full"
                >
                  <Scissors className="h-4 w-4 mr-1.5" />
                  Mulai Pengerjaan
                </Button>
              )}

              {booking.status === BookingStatus.IN_PROGRESS && (
                <Button
                  size="sm"
                  onClick={() => setStatusModalTarget(BookingStatus.COMPLETED)}
                  className="motion-admin-press rounded-full"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Selesai Grooming
                </Button>
              )}

              {/* Reschedule Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRescheduleOpen(true)}
              >
                <CalendarClock className="h-4 w-4 mr-1.5 text-accent" />
                Ubah Jadwal
              </Button>

              {/* Cancel Button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsCancelOpen(true)}
              >
                <Ban className="h-4 w-4 mr-1.5" />
                Batalkan
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Cancellation Notice if Cancelled */}
      {booking.status === BookingStatus.CANCELLED && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">
            Reservasi Telah Dibatalkan
          </AlertTitle>
          <AlertDescription className="text-xs space-y-1 mt-1">
            <div>
              <span className="font-semibold">Alasan Pembatalan:</span>{" "}
              {booking.cancellationReason || "Tidak ada rincian alasan."}
            </div>
            {booking.cancelledAt && (
              <div className="text-muted-foreground">
                Dibatalkan pada: {formatIndonesianDate(booking.cancelledAt)}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Snapshot Card */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-accent" />
                  Layanan & Biaya
                </CardTitle>
                <span className="text-xs text-muted-foreground font-medium">
                  Stasiun: {booking.resource?.name || "Main Grooming Station"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg bg-muted/40">
                <div>
                  <h3 className="font-bold text-foreground text-base">
                    {booking.serviceNameSnapshot || booking.serviceSnapshotName || booking.service?.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Durasi: {booking.serviceDurationSnapshot ?? booking.serviceSnapshotDuration ?? booking.service?.durationMinutes} menit
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Total Biaya</span>
                  <span className="text-lg font-bold text-primary">
                    {formatIDR(Number(booking.totalPrice))}
                  </span>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 border rounded-lg space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-accent" />
                    Hari & Tanggal
                  </span>
                  <span className="font-semibold text-foreground text-sm block">
                    {dateStr}
                  </span>
                </div>
                <div className="p-3 border rounded-lg space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-accent" />
                    Waktu Pengerjaan
                  </span>
                  <span className="font-semibold text-foreground text-sm block">
                    {timeRangeStr} WIB
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card: Customer Notes & Internal Staff Notes */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                Catatan Reservasi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              {/* Customer Notes */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Catatan dari Pelanggan
                </span>
                <div className="p-3 rounded-md bg-muted/30 border text-xs text-foreground min-h-[48px]">
                  {booking.customerNotes ? (
                    <p className="whitespace-pre-wrap">{booking.customerNotes}</p>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Tidak ada catatan khusus dari pelanggan.
                    </span>
                  )}
                </div>
              </div>

              {/* Editable Internal Notes */}
              <InternalNotesForm
                bookingId={booking.id}
                initialNotes={booking.internalNotes}
                onNotesSaved={(newNotes) => {
                  setBooking((prev) => ({ ...prev, internalNotes: newNotes }));
                }}
              />
            </CardContent>
          </Card>

          {/* Histories & Logs */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-accent" />
                Riwayat Status & Reschedule
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Reschedule Histories */}
              {booking.rescheduleHistories && booking.rescheduleHistories.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Histori Perubahan Jadwal ({booking.rescheduleHistories.length})
                  </h4>
                  <div className="space-y-2 border-l-2 border-accent/40 pl-3">
                    {booking.rescheduleHistories.map((hist: BookingRescheduleHistoryItem) => (
                      <div key={hist.id} className="text-xs space-y-1 pb-2">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="font-semibold text-accent">Perubahan Jadwal</span>
                          <span>{formatIndonesianDate(hist.createdAt)}</span>
                        </div>
                        <div className="text-foreground">
                          Dari: <span className="line-through">{formatIndonesianDate(hist.previousStartAt)}</span>
                          {" -> "}
                          <span className="font-medium">{formatIndonesianDate(hist.newStartAt)}</span>
                        </div>
                        <div className="text-muted-foreground italic">
                          Alasan: &ldquo;{hist.reason}&rdquo;
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Transition History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Log Perubahan Status
                </h4>
                {booking.statusHistories && booking.statusHistories.length > 0 ? (
                  <div className="space-y-2.5 border-l-2 border-primary/30 pl-3">
                    {booking.statusHistories.map((hist: BookingStatusHistoryItem) => (
                      <div key={hist.id} className="text-xs space-y-0.5 pb-2">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {hist.fromStatus ? `${STATUS_LABELS[hist.fromStatus] || hist.fromStatus} -> ` : ""}
                            <span className="text-primary">{STATUS_LABELS[hist.toStatus] || hist.toStatus}</span>
                          </span>
                          <span>{formatIndonesianDate(hist.createdAt)}</span>
                        </div>
                        {hist.reason && (
                          <div className="text-muted-foreground text-[11px]">
                            {hist.reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Belum ada riwayat perubahan status.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Customer & Pet Profiles */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                Data Pelanggan
              </CardTitle>
              {booking.customerId && (
                <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-[11px]">
                  <Link href={`/dashboard/customers/${booking.customerId}`}>
                    Profil
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Nama Lengkap</span>
                <span className="font-semibold text-foreground text-sm">
                  {booking.customer?.name || "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Nomor Telepon</span>
                <span className="font-medium text-foreground">
                  {booking.customer?.phone || "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Email</span>
                <span className="text-foreground">
                  {booking.customer?.email || <span className="text-muted-foreground italic">Tidak diisi</span>}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pet Profile Card */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PawPrint className="h-4 w-4 text-accent" />
                Data Anabul
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Nama Anabul</span>
                <span className="font-semibold text-foreground text-sm">
                  {booking.pet?.name || "-"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Jenis</span>
                  <span className="font-medium text-foreground">
                    {booking.pet?.type || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Ras</span>
                  <span className="font-medium text-foreground">
                    {booking.pet?.breed || "-"}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Usia</span>
                <span className="text-foreground">
                  {booking.pet?.age !== null && booking.pet?.age !== undefined
                    ? `${booking.pet.age} tahun`
                    : "-"}
                </span>
              </div>
              {booking.pet?.notes && (
                <div>
                  <span className="text-muted-foreground block text-[11px]">Catatan Anabul</span>
                  <p className="text-foreground bg-muted/40 p-2 rounded border mt-0.5">
                    {booking.pet.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meta & Audit Summary */}
          <Card className="border-border bg-muted/20">
            <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Dibuat:</span>
                <span className="font-medium text-foreground">
                  {formatIndonesianDate(booking.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Terakhir diperbarui:</span>
                <span className="font-medium text-foreground">
                  {formatIndonesianDate(booking.updatedAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sumber:</span>
                <span className="font-medium text-foreground">
                  {getBookingSourceLabel(booking.source)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <RescheduleModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        bookingId={booking.id}
        bookingCode={booking.bookingCode}
        serviceId={booking.serviceId}
        serviceName={booking.serviceSnapshotName || booking.service?.name || "Layanan Grooming"}
        currentDate={dateOnlyJakarta}
        currentTime={startTimeStr}
        onSuccess={reloadData}
      />

      <CancelModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        bookingId={booking.id}
        bookingCode={booking.bookingCode}
        onSuccess={reloadData}
      />

      <StatusTransitionModal
        isOpen={statusModalTarget !== null}
        onClose={() => setStatusModalTarget(null)}
        bookingId={booking.id}
        bookingCode={booking.bookingCode}
        currentStatus={booking.status}
        targetStatus={statusModalTarget}
        onSuccess={reloadData}
      />
    </div>
  );
}
