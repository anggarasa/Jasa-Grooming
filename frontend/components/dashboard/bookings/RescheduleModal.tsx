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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { TimeSlot } from "@backend/modules/availability/types";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingCode: string;
  serviceId: string;
  serviceName: string;
  currentDate: string;
  currentTime: string;
  onSuccess: () => void;
}

export function RescheduleModal({
  isOpen,
  onClose,
  bookingId,
  bookingCode,
  serviceId,
  serviceName,
  currentDate,
  currentTime,
  onSuccess,
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = React.useState<string>(currentDate);
  const [selectedTime, setSelectedTime] = React.useState<string>("");
  const [reason, setReason] = React.useState<string>("");

  const [slots, setSlots] = React.useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = React.useState<boolean>(false);
  const [slotError, setSlotError] = React.useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleClose = () => {
    setSelectedDate(currentDate);
    setSelectedTime("");
    setReason("");
    setSubmitError(null);
    setSlotError(null);
    onClose();
  };

  // Fetch slot ketersediaan saat selectedDate berubah
  React.useEffect(() => {
    if (!isOpen || !selectedDate || !serviceId) return;

    let isSubscribed = true;

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setSlotError(null);

      try {
        const res = await fetch(
          `/api/admin/availability?serviceId=${encodeURIComponent(
            serviceId
          )}&date=${encodeURIComponent(selectedDate)}&excludeBookingId=${encodeURIComponent(
            bookingId
          )}`
        );
        const json = await res.json();

        if (!isSubscribed) return;

        if (json.success && json.data) {
          setSlots(json.data.slots || []);
        } else {
          setSlotError(json.error?.message || "Gagal memuat slot ketersediaan.");
          setSlots([]);
        }
      } catch {
        if (isSubscribed) {
          setSlotError("Terjadi kesalahan jaringan saat mengambil slot.");
          setSlots([]);
        }
      } finally {
        if (isSubscribed) {
          setIsLoadingSlots(false);
        }
      }
    };

    fetchSlots();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, selectedDate, serviceId, bookingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) {
      setSubmitError("Silakan pilih slot waktu baru.");
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      setSubmitError("Alasan perubahan jadwal minimal 3 karakter.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Gagal mengubah jadwal reservasi.");
      }

      toast.success("Jadwal reservasi berhasil diubah!");
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Calendar className="h-5 w-5 text-accent" />
            Ubah Jadwal Reservasi
          </DialogTitle>
          <DialogDescription>
            Pilih tanggal dan slot waktu baru untuk reservasi #{bookingCode} ({serviceName}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2" aria-label="Form Ubah Jadwal Reservasi">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Info Jadwal Saat Ini */}
          <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground flex items-center justify-between">
            <span className="font-medium text-foreground">Jadwal Sekarang:</span>
            <span className="font-semibold text-primary">
              {currentDate} pukul {currentTime} WIB
            </span>
          </div>

          {/* Pilih Tanggal Baru */}
          <div className="space-y-2">
            <Label htmlFor="reschedule-date" className="text-sm font-semibold">
              Pilih Tanggal Baru
            </Label>
            <Input
              id="reschedule-date"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime("");
              }}
              required
              className="w-full"
            />
          </div>

          {/* Pilih Jam Baru */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Pilih Jam Baru
              </Label>
              {isLoadingSlots && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Memeriksa slot...
                </span>
              )}
            </div>

            {slotError && (
              <p className="text-xs text-destructive">{slotError}</p>
            )}

            {!isLoadingSlots && slots.length === 0 && !slotError && (
              <p className="text-xs text-muted-foreground italic py-2">
                Tidak ada slot yang tersedia pada tanggal ini atau toko tutup.
              </p>
            )}

            {!isLoadingSlots && slots.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 border rounded-md">
                {slots.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`text-xs py-1.5 px-2 rounded-md font-medium transition-all text-center border ${
                        !slot.available
                          ? "opacity-35 bg-muted cursor-not-allowed border-transparent text-muted-foreground"
                          : isSelected
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white hover:bg-secondary border-border text-foreground"
                      }`}
                      title={slot.available ? "Pilih slot" : `Tidak tersedia (${slot.reason})`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedTime && (
              <p className="text-xs text-accent font-medium mt-1">
                Slot terpilih: <span className="font-bold">{selectedTime} WIB</span>
              </p>
            )}
          </div>

          {/* Alasan Reschedule */}
          <div className="space-y-2">
            <Label htmlFor="reschedule-reason" className="text-sm font-semibold">
              Alasan Perubahan Jadwal <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reschedule-reason"
              placeholder="Contoh: Permintaan pelanggan via WhatsApp, anabul sedang flu, dsb."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedTime || !reason.trim()}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan Jadwal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
