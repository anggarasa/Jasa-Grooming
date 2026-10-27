"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  MessageCircle,
  Clock,
  ArrowRight,
  Info,
  CalendarCheck2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicServiceItem } from "@backend/modules/public/public-services.service";
import { PublicBusinessProfile } from "@backend/modules/public/public-business.service";
import { buildWhatsAppUrl } from "@/lib/utils";

interface BookingTransitionCardProps {
  selectedService: PublicServiceItem | null;
  business: PublicBusinessProfile | null;
}

export function BookingTransitionCard({
  selectedService,
  business,
}: BookingTransitionCardProps) {
  const businessName = business?.name || "PawCare Grooming";
  const waNumber = business?.whatsapp || business?.phone;

  const waMessage = selectedService
    ? `Halo ${businessName}, saya ingin melakukan reservasi untuk layanan "${selectedService.name}" (${selectedService.formattedPrice}, estimasi durasi ${selectedService.durationMinutes} menit). Apakah ada slot jadwal tersedia dalam waktu dekat?`
    : `Halo ${businessName}, saya ingin konsultasi dan menanyakan jadwal ketersediaan reservasi grooming untuk hewan peliharaan saya.`;

  const waUrl = buildWhatsAppUrl(waNumber, waMessage);

  return (
    <div className="space-y-8">
      {/* Notice Banner: Phase 05 Transition */}
      <div className="rounded-2xl border border-accent/30 bg-accent-subtle/50 p-5 sm:p-6 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-accent p-2 text-white shrink-0 mt-0.5">
            <Info className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-primary">
                Sistem Reservasi Mandiri Online Segera Hadir
              </h2>
              <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[11px] font-bold text-accent uppercase tracking-wider">
                Fase Transisi
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-foreground/80">
              Modul pemilihan slot mandiri real-time sedang disiapkan untuk <strong>Phase 05</strong>.
              Saat ini, Anda dapat memesan jadwal secara instan dan personal langsung melalui WhatsApp resmi kami.
            </p>
          </div>
        </div>
      </div>

      {/* Selected Service Card OR Empty Service Notice */}
      {selectedService ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border/80 bg-muted/40 p-4 sm:px-6 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Layanan yang Dipilih
            </span>
            <Link
              href="/services"
              className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
            >
              Ganti Layanan
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Image Preview */}
              <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                {selectedService.imageObjectKey ? (
                  <img
                    src={`/api/media/${selectedService.imageObjectKey}`}
                    alt={selectedService.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary text-primary">
                    <Sparkles className="h-8 w-8 text-accent" aria-hidden="true" />
                  </div>
                )}
              </div>

              {/* Service Information */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs font-semibold">
                    {selectedService.category.name}
                  </Badge>
                  <Badge variant="duration" className="text-xs font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>{selectedService.durationMinutes} Menit</span>
                  </Badge>
                </div>

                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {selectedService.name}
                </h3>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {selectedService.shortDescription || selectedService.description}
                </p>

                <div className="pt-2 flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Estimasi Tarif:</span>
                  <span className="text-2xl font-extrabold text-primary">
                    {selectedService.formattedPrice}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Confirmation Button */}
            <div className="mt-6 pt-6 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-whatsapp hover:bg-whatsapp-hover text-whatsapp-foreground font-bold shadow-md flex-1 text-base h-12"
              >
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5 mr-2" aria-hidden="true" />
                  Konfirmasi Booking via WhatsApp
                </a>
              </Button>

              <Button asChild variant="outline" size="lg" className="h-12">
                <Link href="/services">
                  Pilih Layanan Lain
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 sm:p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary mb-4 shadow-2xs">
            <CalendarCheck2 className="h-7 w-7 text-accent" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Belum Memilih Layanan Grooming
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            Silakan pilih paket perawatan hewan kesayangan Anda dari katalog layanan kami terlebih dahulu.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="accent" size="lg" className="font-semibold shadow-xs">
              <Link href="/services">
                Buka Katalog Layanan
                <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
              </Link>
            </Button>

            {waNumber && (
              <Button asChild variant="outline" size="lg">
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2 text-whatsapp" aria-hidden="true" />
                  Konsultasi Langsung
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Booking Steps Guide */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <h4 className="text-base font-bold text-foreground mb-4">
          Cara Melakukan Reservasi di {businessName}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">
              1
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Pilih Paket Layanan</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Pilih varian grooming yang cocok untuk ras dan kondisi peliharaan Anda.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">
              2
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Kirim Pesan WhatsApp</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Staf admin kami akan mengonfirmasi jam slot kosong tercepat hari ini atau besok.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-bold">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Datang Sesuai Jadwal</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Hewan kesayangan siap dimanjakan dengan higienis tanpa antre berlama-lama.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
