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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingCode: string;
  onSuccess: () => void;
}

export function CancelModal({
  isOpen,
  onClose,
  bookingId,
  bookingCode,
  onSuccess,
}: CancelModalProps) {
  const [reason, setReason] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleClose = () => {
    setReason("");
    setSubmitError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setSubmitError("Alasan pembatalan minimal 3 karakter.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Gagal membatalkan reservasi.");
      }

      toast.success("Reservasi berhasil dibatalkan.");
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
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Batalkan Reservasi
          </DialogTitle>
          <DialogDescription>
            Tindakan ini akan membatalkan reservasi #{bookingCode} dan melepaskan kapasitas slot waktu secara instan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2" aria-label="Form Batalkan Reservasi">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="cancel-reason" className="text-sm font-semibold">
              Alasan Pembatalan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="Contoh: Pelanggan tidak dapat hadir karena darurat, duplikasi pesanan, dsb."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Alasan pembatalan akan dicatat ke dalam log audit dan histori reservasi.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Kembali
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || !reason.trim() || reason.trim().length < 3}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Membatalkan...
                </>
              ) : (
                "Konfirmasi Batalkan Reservasi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
