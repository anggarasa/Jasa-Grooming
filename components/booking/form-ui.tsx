import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Gaya dan potongan UI yang sama untuk form di wizard booking (Data Pemilik dan
 * Data Anabul), agar tampilan field, penanda Wajib/Opsional, dan pesan galat
 * konsisten. Hanya tampilan: validasi tetap dari skema yang dipakai bersama server.
 */

/** Kolom isian: tinggi 48px, teks 16px (tidak memicu zoom otomatis di iOS). */
export const fieldBase =
  "h-12 rounded-xl border-0 bg-white px-4 text-base text-ink ring-1 ring-inset ring-field-border placeholder:text-ink-muted md:text-base focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-0";
/** Lebar nyaman dibaca untuk form satu kolom. */
export const narrowClass = "sm:max-w-[30rem]";
export const errorFieldClass = "ring-2 ring-destructive focus-visible:ring-destructive";
export const labelRowClass = "flex items-center justify-between gap-3";
export const labelClass = "flex items-center gap-2 text-[15px] font-semibold leading-snug text-ink";

/** Penanda teks "Wajib" / "Opsional" (tidak hanya tanda bintang). */
export function RequirementBadge({ required }: { required: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-medium leading-snug",
        required ? "bg-pill-status text-forest-ink" : "bg-chip text-ink-muted"
      )}
    >
      {required ? "Wajib" : "Opsional"}
    </span>
  );
}

/** Tanda * merah yang disembunyikan dari pembaca layar (status wajib dibaca lewat aria-required). */
export function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      *
    </span>
  );
}

/**
 * Pesan galat dari skema + satu baris panduan cara memperbaiki. `id` dipakai
 * sebagai aria-describedby pada input.
 */
export function FieldError({ id, message, fix }: { id: string; message: string; fix: string }) {
  return (
    <div id={id} className="space-y-0.5">
      <p className="flex items-start gap-1.5 text-[15px] font-medium leading-6 text-destructive">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </p>
      <p className="pl-[1.375rem] text-[15px] leading-6 text-ink-body">{fix}</p>
    </div>
  );
}
