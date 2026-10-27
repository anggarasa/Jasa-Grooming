"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, PhoneCall, CheckCircle2 } from "lucide-react";
import { siteConfig } from "@/config/site";

interface PhaseNoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedServiceName?: string | null;
}

export function PhaseNoticeDialog({
  open,
  onOpenChange,
  selectedServiceName,
}: PhaseNoticeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="accent" className="font-semibold text-xs py-1">
              Phase 01 — Pondasi Selesai
            </Badge>
            <Badge variant="outline" className="text-xs py-1">
              Phase 02 Sedang Berjalan
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-accent" />
            Fitur Reservasi Mandiri Segera Hadir
          </DialogTitle>
          <DialogDescription className="pt-2 text-foreground/80 leading-relaxed text-sm">
            {selectedServiceName ? (
              <span>
                Anda tertarik dengan paket <strong>{selectedServiceName}</strong>.
              </span>
            ) : null}{" "}
            Saat ini arsitektur dasar, basis data PostgreSQL, dan penyimpanan
            MinIO telah aktif. Alur reservasi interaktif, pemilihan tanggal, dan
            slot waktu otomatis sedang disiapkan untuk <strong>Phase 02</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-secondary/60 p-4 border border-secondary text-sm space-y-2">
          <div className="font-semibold text-primary flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Butuh reservasi mendesak untuk anabul Anda hari ini?
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Hubungi tim layanan pelanggan kami langsung via telepon atau WhatsApp
            untuk konfirmasi jadwal darurat.
          </p>
          <div className="pt-1 text-sm font-medium text-primary">
            📞 {siteConfig.phone} (09:00 - 19:00 WIB)
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
          <Button
            type="button"
            variant="accent"
            asChild
            className="font-medium"
          >
            <a
              href={`https://wa.me/${siteConfig.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                selectedServiceName
                  ? `Halo PawCare, saya ingin konsultasi mengenai layanan ${selectedServiceName}.`
                  : "Halo PawCare, saya ingin konsultasi mengenai booking grooming."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <PhoneCall className="h-4 w-4" />
              Hubungi via WhatsApp
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
