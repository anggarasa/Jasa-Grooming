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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface DisconnectConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DisconnectConfirmDialog({
  isOpen,
  onClose,
  onSuccess,
}: DisconnectConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDisconnect = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/integrations/google/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Gagal memutuskan koneksi Google Calendar.");
      }

      toast.success("Koneksi Google Calendar berhasil diputuskan.");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memutuskan koneksi.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Putuskan Google Calendar
          </DialogTitle>
          <DialogDescription>
            Tindakan ini akan mencabut akses akun Google Calendar dari sistem PawCare Grooming.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-2">
            <p className="text-sm font-semibold text-warning-foreground dark:text-amber-400">
              Peringatan Keamanan & Operasional
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Memutuskan Google Calendar akan menghentikan sinkronisasi otomatis. Booking Anda tetap tersimpan di sistem.
            </p>
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1 pt-1">
              <li>Token otentikasi Google akan dicabut dari server Google.</li>
              <li>Webhook channel push notification akan dihentikan secara aman.</li>
              <li>Riwayat booking dan jadwal lokal PawCare Grooming tidak akan terhapus.</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
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
            variant="destructive"
            onClick={handleDisconnect}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memutuskan...
              </>
            ) : (
              "Ya, Putuskan Koneksi"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
