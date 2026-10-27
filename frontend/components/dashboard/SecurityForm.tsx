"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Loader2,
  KeyRound,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@/lib/zod-resolver";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@backend/modules/auth/schemas";
import { changePasswordApi } from "@/lib/auth/client";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PasswordRule {
  label: string;
  test: (val: string) => boolean;
}

const passwordRules: PasswordRule[] = [
  {
    label: "Minimal 12 karakter",
    test: (val) => val.length >= 12,
  },
  {
    label: "Minimal 1 huruf kapital (A-Z)",
    test: (val) => /[A-Z]/.test(val),
  },
  {
    label: "Minimal 1 huruf kecil (a-z)",
    test: (val) => /[a-z]/.test(val),
  },
  {
    label: "Minimal 1 angka (0-9)",
    test: (val) => /[0-9]/.test(val),
  },
  {
    label: "Minimal 1 simbol / karakter khusus (!@#$%^&*)",
    test: (val) => /[^A-Za-z0-9]/.test(val),
  },
];

export function SecurityForm() {
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Hitung jumlah kriteria yang terpenuhi
  const passedCount = passwordRules.filter((r) =>
    r.test(newPasswordValue)
  ).length;

  const strengthColor =
    passedCount <= 2
      ? "bg-destructive text-destructive"
      : passedCount <= 4
      ? "bg-amber-500 text-amber-500"
      : "bg-emerald-500 text-emerald-500";

  const strengthLabel =
    passedCount <= 2
      ? "Lemah"
      : passedCount <= 4
      ? "Sedang"
      : "Sangat Kuat";

  const onSubmit = async (data: ChangePasswordInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await changePasswordApi(data);
      if (!res.success) {
        const errorMsg =
          res.error || "Gagal memperbarui kata sandi. Periksa input Anda.";
        setServerError(errorMsg);
        toast.error("Gagal Mengubah Sandi", {
          description: errorMsg,
        });
        return;
      }

      toast.success("Kata Sandi Berhasil Diperbarui", {
        description:
          "Kata sandi baru telah aktif. Seluruh sesi di perangkat lain telah dicabut secara otomatis.",
      });

      reset();
      setNewPasswordValue("");
    } catch {
      const netErr =
        "Terjadi kesalahan saat menghubungi server. Silakan coba kembali.";
      setServerError(netErr);
      toast.error("Kesalahan Jaringan", { description: netErr });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Keamanan Akun
        </h1>
        <p className="text-sm text-muted-foreground">
          Perbarui kata sandi dan amankan akses akun administrator PawCare Grooming.
        </p>
      </div>

      {/* Security Notice Banner */}
      <Alert className="border-border bg-secondary/40 text-secondary-foreground">
        <ShieldAlert className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-semibold">
          Kebijakan Keamanan Sesi
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground mt-1">
          Mengubah kata sandi akan otomatis membatalkan token dan mencabut sesi di
          semua perangkat lain demi melindungi akun Anda dari penyalahgunaan.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Form Ubah Sandi */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-accent" />
                Form Perubahan Kata Sandi
              </CardTitle>
              <CardDescription>
                Masukkan kata sandi saat ini dan buat kata sandi baru yang memenuhi standar keamanan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {serverError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Perhatian</AlertTitle>
                  <AlertDescription className="text-xs">{serverError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium">
                    Kata Sandi Saat Ini
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="currentPassword"
                      type={showCurrent ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      className={`pl-10 pr-10 h-10 ${
                        errors.currentPassword
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      aria-invalid={!!errors.currentPassword}
                      aria-describedby={
                        errors.currentPassword ? "current-error" : undefined
                      }
                      {...register("currentPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((p) => !p)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                      tabIndex={-1}
                      aria-label={
                        showCurrent ? "Sembunyikan kata sandi" : "Lihat kata sandi"
                      }
                    >
                      {showCurrent ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p
                      id="current-error"
                      className="text-xs text-destructive font-medium"
                    >
                      {errors.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">
                    Kata Sandi Baru
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Minimal 12 karakter kombinasi"
                      className={`pl-10 pr-10 h-10 ${
                        errors.newPassword
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      aria-invalid={!!errors.newPassword}
                      aria-describedby={
                        errors.newPassword ? "new-error" : undefined
                      }
                      {...register("newPassword", {
                        onChange: (e) => setNewPasswordValue(e.target.value),
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((p) => !p)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                      tabIndex={-1}
                      aria-label={
                        showNew ? "Sembunyikan kata sandi" : "Lihat kata sandi"
                      }
                    >
                      {showNew ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p id="new-error" className="text-xs text-destructive font-medium">
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Password Strength Indicator */}
                {newPasswordValue.length > 0 && (
                  <div className="space-y-2 p-3 rounded-lg bg-muted/40 border border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        Kekuatan Sandi:
                      </span>
                      <span className={`font-semibold ${strengthColor.split(" ")[1]}`}>
                        {strengthLabel} ({passedCount}/5 kriteria)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          strengthColor.split(" ")[0]
                        }`}
                        style={{ width: `${(passedCount / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Konfirmasi Kata Sandi Baru
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Ketik ulang kata sandi baru"
                      className={`pl-10 pr-10 h-10 ${
                        errors.confirmPassword
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={
                        errors.confirmPassword ? "confirm-error" : undefined
                      }
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                      tabIndex={-1}
                      aria-label={
                        showConfirm ? "Sembunyikan kata sandi" : "Lihat kata sandi"
                      }
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p
                      id="confirm-error"
                      className="text-xs text-destructive font-medium"
                    >
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary-hover text-primary-foreground min-w-[160px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Memproses...
                      </>
                    ) : (
                      "Perbarui Kata Sandi"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Standar Kebijakan & Link Sesi */}
        <div className="space-y-6">
          {/* Standar Kebijakan Sandi */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Kriteria Kata Sandi
              </CardTitle>
              <CardDescription>
                Kata sandi baru wajib memenuhi semua persyaratan berikut:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs">
                {passwordRules.map((rule, idx) => {
                  const passed = rule.test(newPasswordValue);
                  return (
                    <li
                      key={idx}
                      className={`flex items-start gap-2 transition-colors ${
                        passed
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {passed ? (
                        <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-muted-foreground/60 mt-0.5" />
                      )}
                      <span>{rule.label}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          {/* Quick link to Sessions */}
          <Card className="border-border bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Manajemen Sesi
              </CardTitle>
              <CardDescription>
                Lihat perangkat mana saja yang sedang mengakses akun Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full text-xs">
                <Link href="/dashboard/sessions">
                  Kelola Sesi Aktif
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
