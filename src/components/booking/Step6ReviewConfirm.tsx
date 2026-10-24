"use client";

import * as React from "react";
import {
  Calendar,
  Clock,
  User,
  Sparkles,
  Phone,
  Mail,
  AlertCircle,
  FileText,
  Loader2,
  CheckCircle,
  Banknote,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PublicServiceItem } from "@/modules/public/public-services.service";
import { formatIDR } from "@/lib/utils";

interface Step6ReviewConfirmProps {
  service: PublicServiceItem;
  date: string;
  time: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  pet: {
    name: string;
    type: string;
    breed?: string;
    age?: number;
    notes?: string;
  };
  customerNotes: string;
  onChangeCustomerNotes: (notes: string) => void;
  onEditStep: (stepNumber: number) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: () => void;
  onSlotConflictRetry: () => void;
}

function formatDateIndo(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(dt);
  } catch {
    return dateStr;
  }
}

export function Step6ReviewConfirm({
  service,
  date,
  time,
  customer,
  pet,
  customerNotes,
  onChangeCustomerNotes,
  onEditStep,
  isSubmitting,
  errorMessage,
  onSubmit,
  onSlotConflictRetry,
}: Step6ReviewConfirmProps) {
  const isConflictError = errorMessage?.toLowerCase().includes("slot") || errorMessage?.toLowerCase().includes("terisi") || errorMessage?.toLowerCase().includes("bertabrakan");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Konfirmasi & Ringkasan Reservasi
        </h2>
        <p className="text-sm text-muted-foreground">
          Periksa kembali seluruh detail pemesanan Anda sebelum melakukan konfirmasi reservasi.
        </p>
      </div>

      {/* Error Alert with conflict resolution */}
      {errorMessage && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-bold text-destructive">
                Reservasi Tidak Dapat Diproses
              </h3>
              <p className="text-xs text-destructive/90 leading-relaxed">
                {errorMessage}
              </p>
            </div>
          </div>
          {isConflictError && (
            <div className="pt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onSlotConflictRetry}
                className="text-xs"
              >
                Pilih Jam Lain
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Main Review Card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Header summary banner */}
        <div className="border-b border-border bg-muted/40 p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Paket Layanan
              </span>
              <h3 className="text-base font-bold text-foreground">
                {service.name}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">Total Biaya</span>
            <span className="text-xl font-black text-primary">
              {formatIDR(service.price)}
            </span>
          </div>
        </div>

        {/* Details sections */}
        <div className="divide-y divide-border/60">
          {/* Schedule Section */}
          <div className="p-5 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Jadwal Grooming
                </span>
              </div>
              <div className="pl-6 space-y-1">
                <p className="text-sm font-bold text-foreground">
                  {formatDateIndo(date)}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">
                    <Clock className="h-3.5 w-3.5 text-accent" />
                    Pukul {time} WIB
                  </span>
                  <span>•</span>
                  <span>Estimasi Durasi {service.durationMinutes} Menit</span>
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEditStep(2)}
              className="text-xs text-accent hover:text-accent font-semibold"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              <span>Ubah</span>
            </Button>
          </div>

          {/* Pet Section */}
          <div className="p-5 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Data Anabul
                </span>
              </div>
              <div className="pl-6 space-y-1 text-xs">
                <p className="text-sm font-bold text-foreground">
                  {pet.name} <span className="font-normal text-muted-foreground">({pet.type})</span>
                </p>
                {pet.breed && (
                  <p className="text-muted-foreground">
                    Ras: <span className="text-foreground font-medium">{pet.breed}</span>
                  </p>
                )}
                {pet.age !== undefined && (
                  <p className="text-muted-foreground">
                    Usia: <span className="text-foreground font-medium">{pet.age} Tahun</span>
                  </p>
                )}
                {pet.notes && (
                  <p className="text-muted-foreground mt-1 rounded-md bg-muted/60 p-2 italic">
                    &quot;{pet.notes}&quot;
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEditStep(5)}
              className="text-xs text-accent hover:text-accent font-semibold"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              <span>Ubah</span>
            </Button>
          </div>

          {/* Customer Section */}
          <div className="p-5 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Data Pemilik
                </span>
              </div>
              <div className="pl-6 space-y-1 text-xs text-muted-foreground">
                <p className="text-sm font-bold text-foreground">{customer.name}</p>
                <p className="flex items-center gap-1.5 text-foreground font-medium">
                  <Phone className="h-3.5 w-3.5 text-accent" />
                  <span>{customer.phone}</span>
                </p>
                {customer.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEditStep(4)}
              className="text-xs text-accent hover:text-accent font-semibold"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              <span>Ubah</span>
            </Button>
          </div>

          {/* Payment Method Badge */}
          <div className="p-5 bg-secondary/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                <Banknote className="h-5 w-5 text-accent" />
              </div>
              <div>
                <span className="text-xs font-bold text-primary block">
                  Metode Pembayaran
                </span>
                <span className="text-xs text-muted-foreground">
                  Bayar di Lokasi (Cash, QRIS, atau Kartu Debit saat sesi)
                </span>
              </div>
            </div>
            <Badge variant="open" className="text-xs font-semibold py-1 px-2.5">
              Pay at Location
            </Badge>
          </div>
        </div>
      </div>

      {/* Additional Notes Textarea */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <Label htmlFor="booking-customer-notes" className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-accent" />
          <span>Catatan Tambahan untuk Petugas Grooming (Opsional)</span>
        </Label>
        <Textarea
          id="booking-customer-notes"
          rows={2}
          value={customerNotes}
          onChange={(e) => onChangeCustomerNotes(e.target.value)}
          placeholder="Tuliskan pesan atau instruksi penjemputan/kedatangan khusus di sini..."
          className="text-sm"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2 space-y-3">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Memproses Reservasi...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-accent" />
              <span>Konfirmasi & Buat Reservasi</span>
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Dengan menekan tombol di atas, Anda menyetujui jadwal dan ketentuan reservasi salon grooming.
        </p>
      </div>
    </div>
  );
}
