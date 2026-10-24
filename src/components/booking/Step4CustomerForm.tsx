"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { User, Phone, Mail, AlertCircle } from "lucide-react";
import { customerSchema } from "@/modules/bookings/schemas";
import { zodResolver } from "@/lib/zod-resolver";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";

type CustomerFormData = z.infer<typeof customerSchema>;

interface Step4CustomerFormProps {
  initialData: CustomerFormData;
  onSubmitStep: (data: CustomerFormData) => void;
  formId?: string;
}

export function Step4CustomerForm({
  initialData,
  onSubmitStep,
  formId = "booking-customer-form",
}: Step4CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialData.name || "",
      phone: initialData.phone || "",
      email: initialData.email || "",
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    onSubmitStep({
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Data Pemilik & Kontak
        </h2>
        <p className="text-sm text-muted-foreground">
          Mohon isi data diri Anda untuk keperluan verifikasi reservasi dan koordinasi kedatangan.
        </p>
      </div>

      <form
        id={formId}
        aria-label="Form Data Pemilik"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs"
      >
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="customer-name" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <User className="h-4 w-4 text-accent" aria-hidden="true" />
            <span>Nama Lengkap Pelanggan *</span>
          </Label>
          <Input
            id="customer-name"
            placeholder="Contoh: Sarah Wijaya"
            {...register("name")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "customer-name-error" : undefined}
            className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.name && (
            <p id="customer-name-error" className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.name.message}</span>
            </p>
          )}
        </div>

        {/* WhatsApp Phone */}
        <div className="space-y-2">
          <Label htmlFor="customer-phone" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-accent" aria-hidden="true" />
            <span>Nomor WhatsApp Aktif *</span>
          </Label>
          <Input
            id="customer-phone"
            type="tel"
            placeholder="Contoh: 081234567890"
            {...register("phone")}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "customer-phone-error" : "customer-phone-hint"}
            className={errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.phone ? (
            <p id="customer-phone-error" className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.phone.message}</span>
            </p>
          ) : (
            <p id="customer-phone-hint" className="text-xs text-muted-foreground">
              Nomor WhatsApp digunakan untuk mengirimkan status jadwal dan link kelola reservasi.
            </p>
          )}
        </div>

        {/* Email (Optional) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="customer-email" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>Alamat Email</span>
            </Label>
            <span className="text-xs text-muted-foreground font-normal">Opsional</span>
          </div>
          <Input
            id="customer-email"
            type="email"
            placeholder="Contoh: sarah@gmail.com"
            {...register("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "customer-email-error" : undefined}
            className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.email && (
            <p id="customer-email-error" className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
