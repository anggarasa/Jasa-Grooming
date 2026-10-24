"use client";

import * as React from "react";
import { Clock, AlertCircle, RefreshCw, Moon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SlotItem {
  time: string;
  available: boolean;
  reason?: string;
}

interface Step3TimeSelectProps {
  serviceId: string;
  date: string;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  refreshTrigger?: number;
}

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

  const availableCount = React.useMemo(
    () => slots.filter((s) => s.available).length,
    [slots]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Pilih Waktu Kedatangan
          </h2>
          <p className="text-sm text-muted-foreground">
            Pilih slot jam mulai pengerjaan grooming untuk anabul Anda.
          </p>
        </div>

        {/* Reload button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReload}
          disabled={loading}
          className="self-start sm:self-auto text-xs flex items-center gap-1.5"
          aria-label="Segarkan ketersediaan slot waktu"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span>Perbarui Slot</span>
        </Button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <h3 className="text-base font-semibold text-destructive">
            Gagal Memuat Ketersediaan Slot
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleReload}
            className="mt-2"
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Closed State */}
      {!loading && !error && !isOpen && (
        <div className="rounded-2xl border border-border bg-muted/40 p-8 text-center space-y-3">
          <Moon className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="text-base font-bold text-foreground">
            Salon Tutup Pada Tanggal Terpilih
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Mohon maaf, layanan grooming tidak beroperasi pada hari tersebut. Silakan kembali ke langkah sebelumnya untuk memilih tanggal lainnya.
          </p>
        </div>
      )}

      {/* Empty Slots */}
      {!loading && !error && isOpen && slots.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
          <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="text-base font-bold text-foreground">
            Tidak Ada Slot Tersedia
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Seluruh slot waktu pada tanggal ini telah penuh atau berada di luar batas waktu reservasi.
          </p>
        </div>
      )}

      {/* Slots Grid */}
      {!loading && !error && isOpen && slots.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Tersedia <strong>{availableCount}</strong> dari {slots.length} slot waktu
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                <span>Tersedia</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                <span>Penuh</span>
              </span>
            </div>
          </div>

          <div
            role="radiogroup"
            aria-label="Pilihan slot jam kedatangan"
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5"
          >
            {slots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              const isAvailable = slot.available;

              return (
                <button
                  key={slot.time}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={!isAvailable}
                  onClick={() => isAvailable && onSelectTime(slot.time)}
                  title={slot.reason || (isAvailable ? `Pilih jam ${slot.time}` : "Slot tidak tersedia")}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl p-3 text-center border font-semibold transition-all duration-150 outline-none",
                    isAvailable
                      ? isSelected
                        ? "bg-timeslot-selected text-timeslot-selected-foreground border-timeslot-selected shadow-xs scale-102 cursor-pointer"
                        : "bg-timeslot-available text-timeslot-available-foreground border-timeslot-available-border hover:bg-timeslot-available-hover hover:border-timeslot-available-hover-border cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
                      : "bg-timeslot-unavailable text-timeslot-unavailable-foreground border-timeslot-unavailable-border opacity-50 cursor-not-allowed line-through"
                  )}
                >
                  <span className="text-sm font-bold tracking-tight">
                    {slot.time}
                  </span>
                  {isSelected && (
                    <span className="mt-1 flex items-center gap-0.5 text-[10px] font-medium text-white/90">
                      <Check className="h-3 w-3 stroke-[3]" />
                      <span>Dipilih</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedTime && (
            <div className="rounded-xl border border-accent/30 bg-accent-subtle/40 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider block">
                    Jam Sesi Grooming
                  </span>
                  <span className="text-sm font-bold text-primary">
                    Pukul {selectedTime} WIB
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
