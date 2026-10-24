"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import {
  Building2,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Globe,
  Clock,
  Save,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@/lib/zod-resolver";
import { updateBusinessProfileSchema, UpdateBusinessProfileInput } from "@/modules/business/schemas";
import {
  BusinessProfile,
  updateBusinessProfileApi,
} from "@/lib/business-client";
import { AuthenticatedUser } from "@/modules/auth/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ImageUploadDropzone } from "@/components/media/ImageUploadDropzone";

interface BusinessProfileFormProps {
  business: BusinessProfile;
  user: AuthenticatedUser;
}

export function BusinessProfileForm({ business, user }: BusinessProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isOwner = user.role === "OWNER";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateBusinessProfileInput>({
    resolver: zodResolver(updateBusinessProfileSchema),
    defaultValues: {
      name: business.name || "",
      description: business.description || "",
      email: business.email || "",
      phone: business.phone || "",
      whatsapp: business.whatsapp || "",
      address: business.address || "",
      fullAddress: business.fullAddress || "",
      city: business.city || "",
      province: business.province || "",
      postalCode: business.postalCode || "",
      googleMapsUrl: business.googleMapsUrl || "",
      timezone: business.timezone || "Asia/Jakarta",
      logoObjectKey: business.logoObjectKey || null,
      status: business.status || "ACTIVE",
      isActive: business.isActive ?? true,
    },
  });

  const onSubmit = async (data: UpdateBusinessProfileInput) => {
    if (!isOwner) {
      toast.error("Akses Ditolak", {
        description: "Hanya akun dengan peran Pemilik (Owner) yang dapat mengubah profil bisnis.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateBusinessProfileApi(data);
      if (!res.success) {
        toast.error("Gagal Menyimpan Profil", {
          description: res.error?.message || "Terjadi kesalahan pada data yang dikirim.",
        });
        return;
      }

      toast.success("Profil Bisnis Disimpan", {
        description: "Informasi profil dan identitas PawCare Grooming berhasil diperbarui.",
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
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-accent" />
            Profil & Identitas Bisnis
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola nama usaha, informasi kontak, alamat operasional, dan logo utama PawCare Grooming.
          </p>
        </div>
        <div>
          <Badge variant={business.status === "ACTIVE" ? "open" : "closed"} className="text-xs">
            Status: {business.status === "ACTIVE" ? "Beroperasi Aktif" : "Nonaktif Sementara"}
          </Badge>
        </div>
      </div>

      {!isOwner && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="font-semibold text-xs">Akses Lihat Saja (Read-Only)</AlertTitle>
          <AlertDescription className="text-xs">
            Peran akun Anda saat ini adalah <strong>Administrator</strong>. Pengubahan data profil bisnis hanya dapat dilakukan oleh akun <strong>Pemilik (Owner)</strong>.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Form Detail Bisnis */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informasi Utama</CardTitle>
                <CardDescription>Nama resmi dan pengenal usaha Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Bisnis / Toko</Label>
                  <Input
                    id="name"
                    disabled={!isOwner || isSubmitting}
                    className={errors.name ? "border-destructive" : ""}
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug Sistem (ID URL)</Label>
                  <Input
                    id="slug"
                    disabled
                    value={business.slug}
                    className="bg-muted/50 cursor-not-allowed opacity-80"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Pengenal unik permanen toko untuk rute publik dan sistem reservasi.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi Singkat Usaha</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    disabled={!isOwner || isSubmitting}
                    placeholder="Contoh: Layanan grooming hewan peliharaan profesional dan penuh kasih..."
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kontak & Saluran Komunikasi</CardTitle>
                <CardDescription>
                  Nomor kontak untuk reservasi, konfirmasi WhatsApp, dan pertanyaan pelanggan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                      Nomor WhatsApp Toko
                    </Label>
                    <Input
                      id="whatsapp"
                      placeholder="081234567890"
                      disabled={!isOwner || isSubmitting}
                      {...register("whatsapp")}
                    />
                    {errors.whatsapp && (
                      <p className="text-xs text-destructive">{errors.whatsapp.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Telepon Tambahan / Kantor
                    </Label>
                    <Input
                      id="phone"
                      placeholder="0211234567"
                      disabled={!isOwner || isSubmitting}
                      {...register("phone")}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email Bisnis / Toko
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="info@pawcare.id"
                    disabled={!isOwner || isSubmitting}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  Alamat & Lokasi Fisik
                </CardTitle>
                <CardDescription>
                  Lokasi gerai agar pelanggan mudah menemukan tempat grooming Anda.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat Singkat (Jalan / Nomor)</Label>
                  <Input
                    id="address"
                    placeholder="Jl. Surya Gemilang No. 88"
                    disabled={!isOwner || isSubmitting}
                    {...register("address")}
                  />
                  {errors.address && (
                    <p className="text-xs text-destructive">{errors.address.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullAddress">Alamat Lengkap (Beserta Patokan)</Label>
                  <Textarea
                    id="fullAddress"
                    rows={2}
                    placeholder="Ruko Kemang Grand, Jl. Surya Gemilang No. 88 (sebelah pet cafe)..."
                    disabled={!isOwner || isSubmitting}
                    {...register("fullAddress")}
                  />
                  {errors.fullAddress && (
                    <p className="text-xs text-destructive">{errors.fullAddress.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Kota / Kabupaten</Label>
                    <Input
                      id="city"
                      placeholder="Jakarta Selatan"
                      disabled={!isOwner || isSubmitting}
                      {...register("city")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Provinsi</Label>
                    <Input
                      id="province"
                      placeholder="DKI Jakarta"
                      disabled={!isOwner || isSubmitting}
                      {...register("province")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Kode Pos</Label>
                    <Input
                      id="postalCode"
                      placeholder="12560"
                      disabled={!isOwner || isSubmitting}
                      {...register("postalCode")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleMapsUrl" className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    Tautan Google Maps
                  </Label>
                  <Input
                    id="googleMapsUrl"
                    type="url"
                    placeholder="https://maps.google.com/?q=-6.2000,106.8166"
                    disabled={!isOwner || isSubmitting}
                    {...register("googleMapsUrl")}
                  />
                  {errors.googleMapsUrl && (
                    <p className="text-xs text-destructive">{errors.googleMapsUrl.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kolom Kanan: Logo & Pengaturan Regional */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Logo Bisnis</CardTitle>
                <CardDescription>
                  Logo akan ditampilkan pada header portal, nota booking, dan landing page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Controller
                  control={control}
                  name="logoObjectKey"
                  render={({ field }) => (
                    <ImageUploadDropzone
                      folder="business/logos"
                      value={field.value}
                      onChange={(newKey) => field.onChange(newKey)}
                      aspectRatio="square"
                      label="Berkas Logo"
                      description="Format PNG, WebP, atau JPEG (1:1 direkomendasikan)"
                      disabled={!isOwner || isSubmitting}
                    />
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" />
                  Zona Waktu Operasional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Waktu</Label>
                  <select
                    id="timezone"
                    disabled={!isOwner || isSubmitting}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("timezone")}
                  >
                    <option value="Asia/Jakarta">WIB — Asia/Jakarta (UTC+07:00)</option>
                    <option value="Asia/Makassar">WITA — Asia/Makassar (UTC+08:00)</option>
                    <option value="Asia/Jayapura">WIT — Asia/Jayapura (UTC+09:00)</option>
                  </select>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-accent" />
                  <span>
                    Seluruh perhitungan slot booking, jam buka-tutup, dan istirahat menggunakan acuan zona waktu ini.
                  </span>
                </div>
              </CardContent>
            </Card>

            {isOwner && (
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !isDirty}
                  className="w-full bg-primary hover:bg-primary-hover text-primary-foreground h-11 text-sm font-semibold shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Menyimpan Perubahan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan Profil Bisnis
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
