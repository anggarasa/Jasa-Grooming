"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import {
  Sliders,
  CalendarCheck,
  Clock,
  ShieldAlert,
  Save,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@/lib/zod-resolver";
import {
  updateBookingSettingsSchema,
  UpdateBookingSettingsInput,
} from "@backend/modules/business/schemas";
import {
  BookingSettings,
  updateBookingSettingsApi,
} from "@/lib/business-client";
import { AuthenticatedUser } from "@backend/modules/auth/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BookingSettingsFormProps {
  settings: BookingSettings;
  user: AuthenticatedUser;
}

export function BookingSettingsForm({ settings, user }: BookingSettingsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isOwner = user.role === "OWNER";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateBookingSettingsInput>({
    resolver: zodResolver(updateBookingSettingsSchema),
    defaultValues: {
      bookingEnabled: settings.bookingEnabled ?? true,
      currency: settings.currency || "IDR",
      bookingIntervalMinutes: settings.bookingIntervalMinutes ?? 30,
      defaultBufferMinutes: settings.defaultBufferMinutes ?? 15,
      minimumAdvanceMinutes: settings.minimumAdvanceMinutes ?? 60,
      maximumAdvanceDays: settings.maximumAdvanceDays ?? 30,
      cancellationWindowHours: settings.cancellationWindowHours ?? 24,
      autoConfirmBooking: settings.autoConfirmBooking ?? false,
      allowCustomerReschedule: settings.allowCustomerReschedule ?? true,
    },
  });

  const onSubmit = async (data: UpdateBookingSettingsInput) => {
    if (!isOwner) {
      toast.error("Akses Ditolak", {
        description: "Hanya akun Pemilik (Owner) yang dapat mengubah parameter reservasi.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateBookingSettingsApi(data);
      if (!res.success) {
        toast.error("Gagal Menyimpan Pengaturan", {
          description: res.error?.message || "Terjadi kesalahan pada data yang dikirim.",
        });
        return;
      }

      toast.success("Pengaturan Reservasi Disimpan", {
        description: "Parameter slot waktu dan aturan pemesanan berhasil diperbarui.",
      });

      reset(data);
      router.refresh();
    } catch {
      toast.error("Kesalahan Jaringan", {
        description: "Gagal terhubung ke server. Silakan coba kembali.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sliders className="h-6 w-6 text-accent" />
            Pengaturan Reservasi (Booking)
          </h1>
          <p className="text-sm text-muted-foreground">
            Konfigurasi interval waktu reservasi, batas advance booking, jeda buffer pembersihan, dan aturan pembatalan.
          </p>
        </div>
      </div>

      {!isOwner && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="font-semibold text-xs">Akses Lihat Saja (Read-Only)</AlertTitle>
          <AlertDescription className="text-xs">
            Perubahan pengaturan parameter reservasi hanya dapat dilakukan oleh akun <strong>Pemilik (Owner)</strong>.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Toggle Master Reservasi */}
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="font-semibold text-base text-foreground block">
                  Status Sistem Reservasi Publik
                </span>
                <p className="text-xs text-muted-foreground">
                  Jika dimatikan, halaman reservasi publik akan menampilkan status toko sedang tidak menerima booking baru.
                </p>
              </div>
              <Controller
                control={control}
                name="bookingEnabled"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!isOwner || isSubmitting}
                    aria-label="Aktifkan Pemesanan Online"
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Waktu & Interval Slot */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              Interval Slot & Buffer Waktu
            </CardTitle>
            <CardDescription>
              Menentukan granularitas pembagian jam kedatangan dan jeda istirahat antar layanan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="bookingIntervalMinutes">Interval Slot Jadwal (Menit)</Label>
                <select
                  id="bookingIntervalMinutes"
                  disabled={!isOwner || isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("bookingIntervalMinutes", { valueAsNumber: true })}
                >
                  <option value={15}>15 Menit (Contoh: 09:00, 09:15, 09:30)</option>
                  <option value={30}>30 Menit (Contoh: 09:00, 09:30, 10:00)</option>
                  <option value={45}>45 Menit</option>
                  <option value={60}>60 Menit (1 Jam)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Jarak langkah grid waktu pada formulir pemesanan pelanggan.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultBufferMinutes">Buffer Waktu Default (Menit)</Label>
                <select
                  id="defaultBufferMinutes"
                  disabled={!isOwner || isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("defaultBufferMinutes", { valueAsNumber: true })}
                >
                  <option value={0}>0 Menit (Tanpa jeda)</option>
                  <option value={10}>10 Menit</option>
                  <option value={15}>15 Menit (Direkomendasikan)</option>
                  <option value={20}>20 Menit</option>
                  <option value={30}>30 Menit</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Waktu jeda otomatis untuk sanitasi meja grooming dan peralatan sebelum hewan berikutnya.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batasan Waktu Pemesanan (Advance Booking) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-accent" />
              Batas Waktu Reservasi (Lead Time)
            </CardTitle>
            <CardDescription>
              Aturan seberapa awal pelanggan harus memesan dan batas maksimal reservasi ke depan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="minimumAdvanceMinutes">
                  Pemesanan Minimum Sebelumnya (Menit)
                </Label>
                <Input
                  id="minimumAdvanceMinutes"
                  type="number"
                  min={0}
                  max={10080}
                  disabled={!isOwner || isSubmitting}
                  {...register("minimumAdvanceMinutes", { valueAsNumber: true })}
                />
                <p className="text-[11px] text-muted-foreground">
                  Contoh: 60 menit berarti pelanggan tidak dapat memesan jadwal yang dimulai kurang dari 1 jam dari sekarang.
                </p>
                {errors.minimumAdvanceMinutes && (
                  <p className="text-xs text-destructive">{errors.minimumAdvanceMinutes.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maximumAdvanceDays">
                  Maksimum Reservasi ke Depan (Hari)
                </Label>
                <Input
                  id="maximumAdvanceDays"
                  type="number"
                  min={1}
                  max={365}
                  disabled={!isOwner || isSubmitting}
                  {...register("maximumAdvanceDays", { valueAsNumber: true })}
                />
                <p className="text-[11px] text-muted-foreground">
                  Contoh: 30 hari berarti kalender hanya membuka reservasi maksimal 30 hari ke depan.
                </p>
                {errors.maximumAdvanceDays && (
                  <p className="text-xs text-destructive">{errors.maximumAdvanceDays.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="cancellationWindowHours">
                Batas Waktu Pembatalan Mandiri (Jam)
              </Label>
              <Input
                id="cancellationWindowHours"
                type="number"
                min={0}
                max={168}
                disabled={!isOwner || isSubmitting}
                className="max-w-xs"
                {...register("cancellationWindowHours", { valueAsNumber: true })}
              />
              <p className="text-[11px] text-muted-foreground">
                Pelanggan hanya dapat membatalkan reservasi mandiri jika waktu tersisa lebih dari jam ini (misal: 24 jam sebelum kedatangan).
              </p>
              {errors.cancellationWindowHours && (
                <p className="text-xs text-destructive">{errors.cancellationWindowHours.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Kebijakan Reservasi & Otomatisasi */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-accent" />
              Otomatisasi & Hak Pelanggan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-medium text-sm text-foreground block">
                  Konfirmasi Reservasi Otomatis (Auto-Confirm)
                </span>
                <p className="text-xs text-muted-foreground">
                  Jika aktif, pemesanan yang masuk langsung berstatus DIKONFIRMASI tanpa menunggu persetujuan manual admin.
                </p>
              </div>
              <Controller
                control={control}
                name="autoConfirmBooking"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!isOwner || isSubmitting}
                  />
                )}
              />
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-medium text-sm text-foreground block">
                  Izinkan Penjadwalan Ulang (Reschedule Mandiri)
                </span>
                <p className="text-xs text-muted-foreground">
                  Memberi keleluasaan bagi pelanggan untuk memindahkan tanggal/jam reservasi secara mandiri.
                </p>
              </div>
              <Controller
                control={control}
                name="allowCustomerReschedule"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!isOwner || isSubmitting}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {isOwner && (
          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="bg-primary hover:bg-primary-hover text-primary-foreground min-w-[200px] h-11 text-sm font-semibold shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Konfigurasi Reservasi
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
