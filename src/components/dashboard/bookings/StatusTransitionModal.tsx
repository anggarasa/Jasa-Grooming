"use client";

import * as React from "react";
import { BookingStatus } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowRightCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { STATUS_LABELS } from "./BookingStatusBadge";

interface StatusTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingCode: string;
  currentStatus: BookingStatus;
  targetStatus: BookingStatus | null;
  onSuccess: () => void;
}

export function StatusTransitionModal({
  isOpen,
  onClose,
  bookingId,
  bookingCode,
  currentStatus,
  targetStatus,
  onSuccess,
}: StatusTransitionModalProps) {
  const [reason, setReason] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleClose = () => {
    setReason("");
    setSubmitError(null);
    onClose();
  };

  if (!targetStatus) return null;

  const currentLabel = STATUS_LABELS[currentStatus] || currentStatus;
  const targetLabel = STATUS_LABELS[targetStatus] || targetStatus;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          reason: reason.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Gagal mengubah status reservasi.");
      }

      toast.success(`Status berhasil diubah menjadi ${targetLabel}.`);
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
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <ArrowRightCircle className="h-5 w-5 text-accent" />
            Perbarui Status Reservasi
          </DialogTitle>
          <DialogDescription>
            Ubah status reservasi #{bookingCode} dari &ldquo;{currentLabel}&rdquo; menjadi &ldquo;{targetLabel}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2" aria-label="Form Perbarui Status Reservasi">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Status Saat Ini</span>
              <span className="font-semibold">{currentLabel}</span>
            </div>
            <ArrowRightCircle className="h-4 w-4 text-muted-foreground" />
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Status Baru</span>
              <span className="font-bold text-accent">{targetLabel}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-reason" className="text-sm font-semibold">
              Catatan / Alasan Perubahan (Opsional)
            </Label>
            <Textarea
              id="status-reason"
              placeholder="Contoh: Anabul sudah tiba di lokasi, proses mandi selesai, dsb."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
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
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                `Ubah Status ke ${targetLabel}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
