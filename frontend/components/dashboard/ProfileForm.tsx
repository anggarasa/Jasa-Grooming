"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  User,
  Mail,
  Shield,
  CheckCircle2,
  Clock,
  KeyRound,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@/lib/zod-resolver";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@backend/modules/auth/schemas";
import { updateProfileApi } from "@/lib/auth/client";
import { formatIndonesianDate } from "@/lib/format-date";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProfileFormProps {
  user: AuthenticatedUser;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsSubmitting(true);
    try {
      const res = await updateProfileApi(data);
      if (!res.success) {
        toast.error("Gagal Memperbarui Profil", {
          description: res.error || "Terjadi kesalahan saat menyimpan data.",
        });
        return;
      }

      toast.success("Profil Berhasil Diperbarui", {
        description: "Nama akun Anda telah diperbarui di seluruh sistem.",
      });

      reset({ name: data.name });
      router.refresh();
    } catch {
      toast.error("Kesalahan Jaringan", {
        description: "Tidak dapat terhubung ke server. Silakan coba kembali.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOwner = user.role === "OWNER";
  const formattedLastLogin = formatIndonesianDate(user.lastLoginAt);
  const formattedPasswordChanged = formatIndonesianDate(user.passwordChangedAt);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Profil Pengguna
        </h1>
        <p className="text-sm text-muted-foreground">
          Informasi akun administrator dan pengaturan data diri PawCare Grooming.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Form Perbarui Nama */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                Informasi Dasar Akun
              </CardTitle>
              <CardDescription>
                Perbarui nama lengkap yang akan ditampilkan di seluruh antarmuka admin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Input Nama */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nama Lengkap
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      id="name"
                      type="text"
                      className={`pl-10 h-10 ${
                        errors.name
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      {...register("name")}
                    />
                  </div>
                  {errors.name && (
                    <p id="name-error" className="text-xs text-destructive font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email (Readonly) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Alamat Email
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      Tidak dapat diubah langsung
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      disabled
                      value={user.email}
                      className="pl-10 h-10 bg-muted/50 cursor-not-allowed opacity-80"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email digunakan untuk identifikasi login utama akun ini.
                  </p>
                </div>

                {/* Tombol Simpan */}
                <div className="pt-2 flex items-center justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !isDirty}
                    className="bg-primary hover:bg-primary-hover text-primary-foreground min-w-[140px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Simpan Perubahan
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Detail Status Akun */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                Status & Peran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Tingkat Akses (Role)
                </span>
                <div>
                  <Badge variant={isOwner ? "owner" : "admin"} className="text-xs">
                    {isOwner ? "Pemilik (Owner)" : "Administrator"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground pt-0.5">
                  {isOwner
                    ? "Memiliki kendali penuh terhadap seluruh konfigurasi bisnis."
                    : "Memiliki akses operasional terhadap layanan dan sesi."}
                </p>
              </div>

              <div className="pt-2 border-t border-border space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Status Akun
                </span>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Aktif & Terverifikasi</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Terakhir Masuk
                </span>
                <p className="font-medium text-xs text-foreground">
                  {formattedLastLogin}
                </p>
              </div>

              <div className="pt-2 border-t border-border space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                  <KeyRound className="h-3 w-3" />
                  Kata Sandi Terakhir Diubah
                </span>
                <p className="font-medium text-xs text-foreground">
                  {formattedPasswordChanged}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
