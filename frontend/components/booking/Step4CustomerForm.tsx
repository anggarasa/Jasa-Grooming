"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { User, Phone, Mail } from "lucide-react";
import { customerSchema } from "@backend/modules/bookings/schemas";
import { zodResolver } from "@/lib/zod-resolver";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  FieldError,
  RequiredMark,
  RequirementBadge,
  errorFieldClass,
  fieldBase,
  labelClass,
  labelRowClass,
  narrowClass,
} from "@/components/booking/form-ui";
import { z } from "zod";

type CustomerFormData = z.infer<typeof customerSchema>;

interface Step4CustomerFormProps {
  initialData: CustomerFormData;
  onSubmitStep: (data: CustomerFormData) => void;
  /**
   * Dipanggil sekali saat tahap ini ditinggalkan (Kembali, klik langkah di progres,
   * atau lanjut) dengan isian TERAKHIR yang sudah dirapikan (trim). Hanya untuk
   * menjaga isian saat pengguna kembali; BUKAN data tervalidasi dan tidak boleh
   * dipakai untuk pengiriman. Disimpan di memori saja (tidak di storage/server).
   */
  onDraftChange?: (draft: CustomerFormData) => void;
  formId?: string;
}

/**
 * Tahap 4 — Data Pemilik & Kontak.
 *
 * Field (3): name, phone, email (opsional). Skema validasi (`customerSchema`)
 * dipakai bersama server dan TIDAK diubah; pesan galat tetap dari skema itu.
 * Baris "cara memperbaiki" di bawah pesan galat hanyalah panduan tampilan.
 * Tahap ini tidak melakukan permintaan jaringan, jadi tidak ada keadaan loading.
 */

const fieldClass = cn(fieldBase, narrowClass);
const rowClass = cn(labelRowClass, narrowClass);

/** Panduan memperbaiki isian, ditampilkan bersama pesan galat dari skema. */
const FIX_HINT = {
  name: "Isi nama lengkap Anda, 2–100 karakter. Contoh: Sarah Wijaya.",
  phone:
    "Tulis 8–20 karakter berupa angka; boleh diawali + dan memakai spasi atau tanda -. Contoh: 081234567890.",
  email: "Tulis dengan format nama@email.com, atau kosongkan kolom ini jika tidak ingin mengisi.",
} as const;

export function Step4CustomerForm({
  initialData,
  onSubmitStep,
  onDraftChange,
  formId = "booking-customer-form",
}: Step4CustomerFormProps) {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialData.name || "",
      phone: initialData.phone || "",
      email: initialData.email || "",
    },
  });

  // Simpan isian terakhir saat tahap ditinggalkan, supaya tidak hilang bila
  // pengguna menekan Kembali sebelum "Lanjut".
  const draftCallback = React.useRef(onDraftChange);
  React.useEffect(() => {
    draftCallback.current = onDraftChange;
  }, [onDraftChange]);
  React.useEffect(() => {
    return () => {
      const v = getValues();
      draftCallback.current?.({
        name: (v.name ?? "").trim(),
        phone: (v.phone ?? "").trim(),
        email: (v.email ?? "").trim(),
      });
    };
  }, [getValues]);

  const onSubmit = (data: CustomerFormData) => {
    onSubmitStep({
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold leading-snug text-ink sm:text-2xl">
          Data Pemilik & Kontak
        </h2>
        <p className="text-[15px] leading-6 text-ink-body">
          Mohon isi data diri Anda untuk keperluan verifikasi reservasi dan koordinasi kedatangan.
        </p>
      </div>

      <form
        id={formId}
        aria-label="Form Data Pemilik"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-6 rounded-card-xl bg-white p-5 ring-1 ring-inset ring-border sm:p-6"
      >
        {/* Nama lengkap (wajib) */}
        <div className="space-y-2">
          <div className={rowClass}>
            <Label htmlFor="customer-name" className={labelClass}>
              <User className="size-4 shrink-0 text-forest" aria-hidden="true" />
              <span>
                Nama Lengkap Pelanggan <RequiredMark />
              </span>
            </Label>
            <RequirementBadge required />
          </div>
          <Input
            id="customer-name"
            autoComplete="name"
            autoCapitalize="words"
            enterKeyHint="next"
            placeholder="Contoh: Sarah Wijaya"
            {...register("name")}
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "customer-name-error" : undefined}
            className={cn(fieldClass, errors.name && errorFieldClass)}
          />
          {errors.name && (
            <FieldError id="customer-name-error" message={errors.name.message ?? ""} fix={FIX_HINT.name} />
          )}
        </div>

        {/* Nomor WhatsApp (wajib) */}
        <div className="space-y-2">
          <div className={rowClass}>
            <Label htmlFor="customer-phone" className={labelClass}>
              <Phone className="size-4 shrink-0 text-forest" aria-hidden="true" />
              <span>
                Nomor WhatsApp Aktif <RequiredMark />
              </span>
            </Label>
            <RequirementBadge required />
          </div>
          <Input
            id="customer-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            enterKeyHint="next"
            spellCheck={false}
            placeholder="Contoh: 081234567890"
            {...register("phone")}
            aria-required="true"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "customer-phone-error" : "customer-phone-hint"}
            className={cn(fieldClass, errors.phone && errorFieldClass)}
          />
          {errors.phone ? (
            <FieldError id="customer-phone-error" message={errors.phone.message ?? ""} fix={FIX_HINT.phone} />
          ) : (
            <p id="customer-phone-hint" className="text-[15px] leading-6 text-ink-muted">
              Gunakan nomor WhatsApp aktif agar salon dapat menghubungi Anda untuk koordinasi reservasi.
            </p>
          )}
        </div>

        {/* Email (opsional) */}
        <div className="space-y-2">
          <div className={rowClass}>
            <Label htmlFor="customer-email" className={labelClass}>
              <Mail className="size-4 shrink-0 text-forest" aria-hidden="true" />
              <span>Alamat Email</span>
            </Label>
            <RequirementBadge required={false} />
          </div>
          <Input
            id="customer-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            placeholder="Contoh: sarah@gmail.com"
            {...register("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "customer-email-error" : undefined}
            className={cn(fieldClass, errors.email && errorFieldClass)}
          />
          {errors.email && (
            <FieldError id="customer-email-error" message={errors.email.message ?? ""} fix={FIX_HINT.email} />
          )}
        </div>
      </form>
    </div>
  );
}
