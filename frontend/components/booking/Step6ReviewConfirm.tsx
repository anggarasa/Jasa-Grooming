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
  Pencil,
  TriangleAlert,
  ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PublicServiceItem } from "@backend/modules/public/public-services.service";
import { cn, formatIDR } from "@/lib/utils";

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

/** Batas catatan reservasi sama dengan skema server (hanya untuk penghitung tampilan). */
const MAX_CUSTOMER_NOTES = 500;

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

const sectionLabelClass =
  "flex items-center gap-2 text-[13px] font-semibold uppercase leading-none tracking-wide text-ink-muted";

/** Tombol "Ubah": terlihat jelas (outline hijau), target sentuh 44px, nama aksesibel berbeda per bagian. */
function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ubah ${label}`}
      className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold text-forest-ink ring-1 ring-inset ring-forest transition-colors hover:bg-canvas-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
    >
      <Pencil className="size-4" aria-hidden="true" />
      <span>Ubah</span>
    </button>
  );
}

/**
 * Tahap 6 — Konfirmasi & Ringkasan.
 *
 * Tampilan saja: data, `onSubmit`, `isSubmitting`, `errorMessage`, deteksi bentrok
 * slot ("Pilih Jam Lain"), tujuan tombol "Ubah" (jadwal→2, anabul→5, pemilik→4),
 * dan id `booking-customer-notes` tidak berubah. Pengiriman ke server tetap
 * dilakukan oleh BookingWizard.
 */
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
  // Jadwal wajib lengkap. Bila tanggal/jam kosong (mis. setelah mengganti tanggal lalu
  // melompat ke sini lewat indikator progres), tampilkan "belum dipilih" dan nonaktifkan
  // tombol kirim; pengaman serupa di BookingWizard.handleFinalSubmit tetap ada.
  const scheduleIncomplete = !date || !time;
  const notesLength = customerNotes.length;
  const notesTooLong = notesLength > MAX_CUSTOMER_NOTES;

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold leading-snug text-ink sm:text-2xl">
          Konfirmasi & Ringkasan Reservasi
        </h2>
        <p className="text-[15px] leading-6 text-ink-body">
          Periksa kembali seluruh detail pemesanan Anda sebelum melakukan konfirmasi reservasi.
        </p>
      </div>

      {/* Galat pengiriman (+ jalan keluar bila slot bentrok) */}
      {errorMessage && (
        <div role="alert" className="space-y-4 rounded-card-xl bg-white p-5 ring-2 ring-inset ring-destructive sm:p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-6 shrink-0 text-destructive" aria-hidden="true" />
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-semibold leading-snug text-destructive">
                Reservasi Tidak Dapat Diproses
              </h3>
              <p className="text-[15px] leading-6 text-ink-body">{errorMessage}</p>
            </div>
          </div>
          {isConflictError && (
            <Button
              type="button"
              variant="destructive"
              onClick={onSlotConflictRetry}
              className="min-h-11 w-full px-6 text-[15px] font-semibold sm:w-auto"
            >
              Pilih Jam Lain
            </Button>
          )}
        </div>
      )}

      {/* Kartu ringkasan */}
      <div className="overflow-hidden rounded-card-xl bg-white ring-1 ring-inset ring-border">
        {/* Paket & total */}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 bg-canvas-tint p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-forest text-white">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div>
              <span className="mb-1 block text-[13px] font-semibold uppercase leading-none tracking-wide text-ink-muted">
                Paket Layanan
              </span>
              <h3 className="text-lg font-semibold leading-snug text-ink">{service.name}</h3>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:justify-end">
            <div className="sm:text-right">
              <span className="mb-1 block text-[13px] leading-none text-ink-muted">Total Biaya</span>
              <span className="block text-2xl font-bold leading-none text-forest">
                {formatIDR(service.price)}
              </span>
            </div>
            <EditButton label="paket layanan" onClick={() => onEditStep(1)} />
          </div>
        </div>

        <div className="divide-y divide-border">
          {/* Jadwal */}
          <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
            <div className="space-y-3">
              <p className={sectionLabelClass}>
                <Calendar className="size-4 text-forest" aria-hidden="true" />
                <span>Jadwal Grooming</span>
              </p>
              <div className="space-y-1.5">
                {date ? (
                  <p className="text-base font-semibold leading-snug text-ink">{formatDateIndo(date)}</p>
                ) : (
                  <p className="flex items-center gap-1.5 text-base font-semibold leading-snug text-destructive">
                    <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                    Tanggal belum dipilih
                  </p>
                )}
                <div className="flex flex-col gap-y-1 text-[15px] leading-6 text-ink-body sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
                  {time ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-forest-ink">
                      <Clock className="size-4 text-forest" aria-hidden="true" />
                      Pukul {time} WIB
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-destructive">
                      <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                      Jam belum dipilih
                    </span>
                  )}
                  <span aria-hidden="true" className="hidden sm:inline">•</span>
                  <span>Estimasi Durasi {service.durationMinutes} Menit</span>
                </div>
              </div>
            </div>
            <EditButton label="jadwal grooming" onClick={() => onEditStep(2)} />
          </div>

          {/* Anabul */}
          <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
            <div className="min-w-0 space-y-3">
              <p className={sectionLabelClass}>
                <Sparkles className="size-4 text-forest" aria-hidden="true" />
                <span>Data Anabul</span>
              </p>
              <div className="space-y-1.5 text-[15px] leading-6">
                <p className="text-base font-semibold leading-snug text-ink">
                  {pet.name} <span className="font-normal text-ink-body">({pet.type})</span>
                </p>
                {pet.breed && (
                  <p className="text-ink-muted">
                    Ras: <span className="font-medium text-ink">{pet.breed}</span>
                  </p>
                )}
                {pet.age !== undefined && (
                  <p className="text-ink-muted">
                    Usia: <span className="font-medium text-ink">{pet.age} Tahun</span>
                  </p>
                )}
                {pet.notes && (
                  <p className="mt-2 break-words rounded-xl bg-canvas-tint p-3 italic text-ink-body">
                    &quot;{pet.notes}&quot;
                  </p>
                )}
              </div>
            </div>
            <EditButton label="data anabul" onClick={() => onEditStep(5)} />
          </div>

          {/* Pemilik */}
          <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
            <div className="min-w-0 space-y-3">
              <p className={sectionLabelClass}>
                <User className="size-4 text-forest" aria-hidden="true" />
                <span>Data Pemilik</span>
              </p>
              <div className="space-y-1.5 text-[15px] leading-6 text-ink-body">
                <p className="text-base font-semibold leading-snug text-ink">{customer.name}</p>
                <p className="flex items-center gap-2 font-medium text-ink">
                  <Phone className="size-4 shrink-0 text-forest" aria-hidden="true" />
                  <span>{customer.phone}</span>
                </p>
                {customer.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0 text-forest" aria-hidden="true" />
                    <span className="break-all">{customer.email}</span>
                  </p>
                )}
              </div>
            </div>
            <EditButton label="data pemilik" onClick={() => onEditStep(4)} />
          </div>

          {/* Metode pembayaran */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-canvas-tint p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest text-white">
                <Banknote className="size-5" aria-hidden="true" />
              </span>
              <div>
                <span className="block text-[15px] font-semibold leading-snug text-ink">Metode Pembayaran</span>
                <span className="block text-[15px] leading-6 text-ink-body">
                  Bayar di Lokasi (Cash, QRIS, atau Kartu Debit saat sesi)
                </span>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-pill-status px-3 py-1 text-[13px] font-semibold leading-snug text-forest-ink">
              Pay at Location
            </span>
          </div>
        </div>
      </div>

      {/* Catatan tambahan */}
      <div className="space-y-2 rounded-card-xl bg-white p-5 ring-1 ring-inset ring-border sm:p-6">
        <Label htmlFor="booking-customer-notes" className="flex items-center gap-2 text-[15px] font-semibold leading-snug text-ink">
          <FileText className="size-4 shrink-0 text-forest" aria-hidden="true" />
          <span>Catatan Tambahan untuk Petugas Grooming (Opsional)</span>
        </Label>
        <Textarea
          id="booking-customer-notes"
          rows={3}
          value={customerNotes}
          onChange={(e) => onChangeCustomerNotes(e.target.value)}
          aria-describedby="booking-customer-notes-count"
          aria-invalid={notesTooLong || undefined}
          placeholder="Tuliskan pesan atau instruksi penjemputan/kedatangan khusus di sini..."
          className={cn(
            "min-h-24 rounded-xl border-0 bg-white px-4 py-3 text-base text-ink ring-1 ring-inset ring-field-border placeholder:text-ink-muted md:text-base focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-0",
            notesTooLong && "ring-2 ring-destructive focus-visible:ring-destructive"
          )}
        />
        <p
          id="booking-customer-notes-count"
          className={cn("text-right text-[13px] font-medium leading-6 tabular-nums", notesTooLong ? "text-destructive" : "text-ink-muted")}
        >
          {notesTooLong
            ? `${notesLength}/${MAX_CUSTOMER_NOTES} — melebihi batas, ringkas catatan agar reservasi dapat diproses`
            : `${notesLength}/${MAX_CUSTOMER_NOTES}`}
        </p>
      </div>

      {/* Penjelasan sebelum konfirmasi: hanya hal yang benar dari aplikasi; status akhir
          (menunggu/terkonfirmasi) ditentukan pengaturan salon, jadi tidak dijanjikan di sini. */}
      <section
        aria-labelledby="booking-after-confirm-title"
        className="space-y-3 rounded-card-xl bg-canvas-tint p-5 ring-1 ring-inset ring-border sm:p-6"
      >
        <h3 id="booking-after-confirm-title" className="flex items-center gap-2 text-[15px] font-semibold leading-snug text-ink">
          <ReceiptText className="size-4 shrink-0 text-forest" aria-hidden="true" />
          <span>Setelah Anda menekan konfirmasi</span>
        </h3>
        <ul role="list" className="space-y-2 text-[15px] leading-6 text-ink-body">
          <li className="flex gap-2">
            <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-forest" />
            <span>Reservasi Anda dibuat dan Anda akan melihat kode booking.</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-forest" />
            <span>Anda juga mendapat tautan untuk melihat status reservasi. Simpan tautan tersebut.</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-forest" />
            <span>Anda membayar di lokasi saat kunjungan.</span>
          </li>
        </ul>
      </section>

      {/* Kirim */}
      <div className="space-y-3 pt-2">
        {scheduleIncomplete && (
          <p
            id="booking-submit-hint"
            className="flex items-start gap-2 rounded-card-lg bg-white p-4 text-[15px] leading-6 text-destructive ring-1 ring-inset ring-destructive"
          >
            <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <span>Lengkapi jadwal terlebih dahulu: pilih tanggal dan jam melalui tombol &ldquo;Ubah&rdquo; pada bagian Jadwal Grooming.</span>
          </p>
        )}
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || scheduleIncomplete}
          aria-busy={isSubmitting}
          aria-describedby={scheduleIncomplete ? "booking-submit-hint" : undefined}
          className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 text-base font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              <span>Memproses Reservasi...</span>
            </>
          ) : (
            <>
              <CheckCircle className="size-5 text-white" aria-hidden="true" />
              <span>Konfirmasi & Buat Reservasi</span>
            </>
          )}
        </Button>
        <p role="status" className="sr-only">
          {isSubmitting ? "Memproses reservasi, mohon tunggu." : ""}
        </p>
        <p className="text-center text-[15px] leading-6 text-ink-muted">
          Dengan menekan tombol di atas, Anda menyetujui jadwal dan ketentuan reservasi salon grooming.
        </p>
      </div>
    </div>
  );
}
