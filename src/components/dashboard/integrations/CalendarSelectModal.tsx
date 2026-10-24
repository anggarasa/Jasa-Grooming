"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar as CalendarIcon, Check, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AccessibleCalendarItem {
  id: string;
  summary: string;
  description?: string;
  primary: boolean;
  timeZone?: string;
  accessRole?: string;
}

interface CalendarSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCalendarId: string | null;
  onSuccess: () => void;
}

export function CalendarSelectModal({
  isOpen,
  onClose,
  currentCalendarId,
  onSuccess,
}: CalendarSelectModalProps) {
  const [calendars, setCalendars] = React.useState<AccessibleCalendarItem[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>(currentCalendarId || "primary");
  const [prevOpen, setPrevOpen] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync initial selection when modal opens (render-phase adjustment without effect setState)
  if (isOpen && !prevOpen) {
    setPrevOpen(true);
    setSelectedId(currentCalendarId || "primary");
  } else if (!isOpen && prevOpen) {
    setPrevOpen(false);
  }

  // Load calendars when dialog opens
  React.useEffect(() => {
    let isSubscribed = true;

    if (!isOpen) return;

    const loadCalendars = async () => {
      await Promise.resolve();
      if (!isSubscribed) return;
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/integrations/google/calendars");
        const json = await res.json();
        if (!isSubscribed) return;

        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Gagal mengambil daftar kalender Google.");
        }

        const items: AccessibleCalendarItem[] = json.data?.calendars || json.data?.items || [];
        setCalendars(items);

        const activeId = json.data?.selectedCalendarId || currentCalendarId || (items[0]?.id ?? "primary");
        setSelectedId(activeId);
      } catch (err: unknown) {
        if (!isSubscribed) return;
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat kalender.";
        setError(msg);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    loadCalendars();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, currentCalendarId]);

  const handleRetryFetch = () => {
    setIsLoading(true);
    setError(null);
    fetch("/api/integrations/google/calendars")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const items: AccessibleCalendarItem[] = json.data?.calendars || json.data?.items || [];
          setCalendars(items);
        } else {
          setError(json.error?.message || "Gagal mengambil kalender.");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      })
      .finally(() => setIsLoading(false));
  };

  const handleSelectSubmit = async () => {
    if (!selectedId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/integrations/google/select-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId: selectedId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Gagal mengubah kalender aktif.");
      }

      toast.success("Kalender Google berhasil diperbarui.");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto flex flex-col p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <CalendarIcon className="h-5 w-5 text-accent" />
            Pilih Kalender Google
          </DialogTitle>
          <DialogDescription>
            Pilih kalender Google yang akan disinkronkan secara dua arah dengan reservasi toko PawCare Grooming.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
              <span className="text-xs">Memuat daftar kalender akun Google...</span>
            </div>
          ) : calendars.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>Tidak ada kalender yang dapat ditulisi ditemukan pada akun ini.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleRetryFetch}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Coba Lagi
              </Button>
            </div>
          ) : (
            <div className="space-y-2" role="radiogroup" aria-label="Daftar kalender Google">
              {calendars.map((cal) => {
                const isSelected = selectedId === cal.id;
                return (
                  <button
                    key={cal.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Pilih kalender ${cal.summary}`}
                    onClick={() => setSelectedId(cal.id)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 group focus:outline-none focus:ring-2 focus:ring-accent",
                      isSelected
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-border bg-card hover:bg-muted/50 hover:border-border/80"
                    )}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {cal.summary}
                        </span>
                        {cal.primary && (
                          <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                            Utama
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          {cal.accessRole === "owner" ? "Pemilik" : "Izin Tulis"}
                        </Badge>
                      </div>

                      {cal.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {cal.description}
                        </p>
                      )}

                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 font-mono">
                        <span>Zona Waktu: {cal.timeZone || "Asia/Jakarta"}</span>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                        isSelected
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-muted-foreground/40 group-hover:border-muted-foreground"
                      )}
                      aria-hidden="true"
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSelectSubmit}
            disabled={isSubmitting || isLoading || !selectedId || selectedId === currentCalendarId}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Gunakan Kalender Ini"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
