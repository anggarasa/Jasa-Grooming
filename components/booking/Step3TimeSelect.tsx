"use client";

import * as React from "react";
import { Clock, AlertCircle, RefreshCw, Moon, Check, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatFullDateIndo } from "@/components/booking/date-format";

interface SlotItem {
  time: string;
  available: boolean;
  /** Kode alasan dari API ketersediaan (SlotUnavailableReason) atau teks bebas. */
  reason?: string;
}

interface Step3TimeSelectProps {
  serviceId: string;
  date: string;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  refreshTrigger?: number;
}

type SlotKind = "available" | "full" | "unavailable";

/**
 * Hanya memetakan kode alasan yang DIKIRIM server ke teks tampilan. Server
 * tetap satu-satunya penentu tersedia/tidaknya sebuah slot.
 *  - "Penuh": slot sudah terisi (BOOKED, EXTERNAL_BUSY, NO_RESOURCE)
 *  - "Tidak tersedia": ditutup oleh aturan (istirahat, sudah lewat, dst.)
 */
const REASON_LABEL: Record<string, { kind: SlotKind; label: string }> = {
  BOOKED: { kind: "full", label: "Penuh" },
  EXTERNAL_BUSY: { kind: "full", label: "Penuh" },
  NO_RESOURCE: { kind: "full", label: "Penuh" },
  BREAK: { kind: "unavailable", label: "Istirahat" },
  PAST: { kind: "unavailable", label: "Sudah lewat" },
  MIN_ADVANCE: { kind: "unavailable", label: "Terlalu dekat" },
  MAX_ADVANCE: { kind: "unavailable", label: "Terlalu jauh" },
  OUTSIDE_HOURS: { kind: "unavailable", label: "Di luar jam" },
  CLOSED: { kind: "unavailable", label: "Tutup" },
  BLOCKED: { kind: "unavailable", label: "Tidak tersedia" },
  BOOKING_DISABLED: { kind: "unavailable", label: "Tidak tersedia" },
};

function describeSlot(slot: SlotItem): { kind: SlotKind; label: string } {
  if (slot.available) return { kind: "available", label: "" };
  return (slot.reason && REASON_LABEL[slot.reason]) || { kind: "unavailable", label: "Tidak tersedia" };
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

export function Step3TimeSelect({
  serviceId,
  date,
  selectedTime,
  onSelectTime,
  refreshTrigger = 0,
}: Step3TimeSelectProps) {
  const [slots, setSlots] = React.useState<SlotItem[]>([]);
  const [isOpen, setIsOpen] = React.useState<boolean>(true);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [localRefresh, setLocalRefresh] = React.useState<number>(0);

  React.useEffect(() => {
    let ignore = false;

    async function loadSlots() {
      try {
        const res = await fetch(
          `/api/availability?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`
        );
        const json = await res.json();

        if (ignore) return;

        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || json.message || "Gagal memuat slot ketersediaan.");
        }

        setIsOpen(json.data?.isOpen ?? true);
        setSlots(json.slots || []);
        setError(null);
      } catch (err: unknown) {
        if (ignore) return;
        const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat jadwal.";
        setError(message);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadSlots();

    return () => {
      ignore = true;
    };
  }, [serviceId, date, refreshTrigger, localRefresh]);

  const handleReload = () => {
    setLoading(true);
    setLocalRefresh((c) => c + 1);
  };

  // Jam yang tersimpan hanya boleh bertahan bila MASIH tersedia menurut data
  // terbaru. Bila slot sudah penuh/tidak ada, hari tutup, atau data gagal
  // dimuat (tidak bisa diverifikasi), pilihan dihapus agar tidak lanjut dengan
  // jam yang sudah tidak valid.
  React.useEffect(() => {
    if (loading || !selectedTime) return;
    const stillValid =
      !error && isOpen && slots.some((s) => s.time === selectedTime && s.available);
    if (!stillValid) onSelectTime("");
  }, [loading, error, isOpen, slots, selectedTime, onSelectTime]);

  const availableCount = React.useMemo(
    () => slots.filter((s) => s.available).length,
    [slots]
  );
  const hasFull = React.useMemo(() => slots.some((s) => describeSlot(s).kind === "full"), [slots]);
  const hasUnavailable = React.useMemo(
    () => slots.some((s) => describeSlot(s).kind === "unavailable"),
    [slots]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold leading-snug text-ink sm:text-2xl">
            Pilih Waktu Kedatangan
          </h2>
          <p className="text-[15px] leading-6 text-ink-body">
            Pilih slot jam mulai pengerjaan grooming untuk anabul Anda.
          </p>
          {date && (
            <p className="flex items-center gap-2 pt-1 text-[15px] font-semibold text-forest-ink">
              <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
              <span>{formatFullDateIndo(date)}</span>
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReload}
          disabled={loading}
          className="flex items-center gap-1.5 self-start text-sm sm:self-auto"
          aria-label="Segarkan ketersediaan slot waktu"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin motion-reduce:animate-none")} />
          <span>Perbarui Slot</span>
        </Button>
      </div>

      {/* Memuat */}
      {loading && (
        <div className="space-y-4" aria-busy="true">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32 bg-canvas-tint" />
            <Skeleton className="h-4 w-20 bg-canvas-tint" />
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-card-lg bg-canvas-tint" />
            ))}
          </div>
        </div>
      )}

      {/* Galat */}
      {!loading && error && (
        <div role="alert" className="space-y-3 rounded-card-xl bg-white p-6 text-center ring-2 ring-inset ring-destructive/60">
          <AlertCircle className="mx-auto size-8 text-destructive" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-destructive">
            Gagal Memuat Ketersediaan Slot
          </h3>
          <p className="mx-auto max-w-md text-[15px] leading-6 text-ink-body">
            {error}
          </p>
          <Button type="button" variant="outline" onClick={handleReload} className="mt-2">
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Salon tutup pada tanggal ini */}
      {!loading && !error && !isOpen && (
        <div className="space-y-3 rounded-card-xl bg-canvas-tint p-8 text-center ring-1 ring-inset ring-border">
          <Moon className="mx-auto size-8 text-forest" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-ink">
            Salon Tutup Pada Tanggal Terpilih
          </h3>
          <p className="mx-auto max-w-md text-[15px] leading-6 text-ink-body">
            Mohon maaf, layanan grooming tidak beroperasi pada hari tersebut. Silakan kembali ke langkah sebelumnya untuk memilih tanggal lainnya.
          </p>
        </div>
      )}

      {/* Tidak ada slot */}
      {!loading && !error && isOpen && slots.length === 0 && (
        <div className="space-y-2 rounded-card-xl bg-white p-8 text-center ring-1 ring-inset ring-border">
          <Clock className="mx-auto size-8 text-forest" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-ink">
            Tidak Ada Slot Tersedia
          </h3>
          <p className="mx-auto max-w-md text-[15px] leading-6 text-ink-body">
            Seluruh slot waktu pada tanggal ini telah penuh atau berada di luar batas waktu reservasi.
          </p>
        </div>
      )}

      {/* Daftar slot */}
      {!loading && !error && isOpen && slots.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 text-sm text-ink-body sm:flex-row sm:items-center sm:justify-between">
            <span>
              Tersedia <strong className="font-semibold text-ink">{availableCount}</strong> dari {slots.length} slot waktu
            </span>
            {/* Legenda: bentuk + teks, tidak hanya warna */}
            <ul role="list" aria-label="Keterangan status slot" className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-4 rounded bg-white ring-1 ring-inset ring-border" />
                <span>Tersedia</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="flex size-4 items-center justify-center rounded bg-forest">
                  <Check className="size-3 text-white" strokeWidth={3} />
                </span>
                <span>Dipilih</span>
              </li>
              {hasFull && (
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-4 rounded bg-chip ring-1 ring-inset ring-border" />
                  <span>Penuh</span>
                </li>
              )}
              {hasUnavailable && (
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-4 rounded border border-dashed border-ink-muted bg-white" />
                  <span>Tidak tersedia</span>
                </li>
              )}
            </ul>
          </div>

          <div
            role="radiogroup"
            aria-label="Pilihan slot jam kedatangan"
            className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6"
          >
            {slots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              const { kind, label } = describeSlot(slot);
              const isAvailable = kind === "available";

              return (
                <button
                  key={slot.time}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={!isAvailable}
                  onClick={() => isAvailable && onSelectTime(slot.time)}
                  title={isAvailable ? `Pilih jam ${slot.time}` : `${slot.time} · ${label}`}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center rounded-card-lg px-2 py-2.5 text-center transition-colors duration-150",
                    focusRing,
                    isAvailable
                      ? isSelected
                        ? "cursor-pointer bg-forest text-white shadow-float"
                        : "cursor-pointer bg-white text-ink ring-1 ring-inset ring-border hover:bg-canvas-tint hover:ring-forest/60"
                      : kind === "full"
                        ? "cursor-not-allowed bg-chip text-ink-muted ring-1 ring-inset ring-border"
                        : "cursor-not-allowed border border-dashed border-ink-muted bg-white text-ink-muted"
                  )}
                >
                  <span
                    className={cn(
                      "text-base font-bold leading-none tracking-tight",
                      kind === "full" && "line-through"
                    )}
                  >
                    {slot.time}
                  </span>
                  {isSelected && (
                    <span className="mt-1.5 flex items-center gap-1 text-[13px] font-medium leading-none text-white">
                      <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                      <span>Dipilih</span>
                    </span>
                  )}
                  {!isAvailable && (
                    <span className="mt-1.5 text-[13px] font-medium leading-none">{label}</span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedTime && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-card-lg bg-canvas-tint p-4 ring-2 ring-inset ring-forest"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest text-white">
                <Clock className="size-5" aria-hidden="true" />
              </span>
              <div>
                <span className="block text-[13px] font-semibold uppercase leading-none tracking-wide text-forest-ink">
                  Jam Sesi Grooming
                </span>
                <span className="mt-1 block text-base font-bold leading-snug text-ink">
                  Pukul {selectedTime} WIB
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
