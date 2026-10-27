"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { loginSchema, type LoginInput } from "@backend/modules/auth/schemas";
import { zodResolver } from "@/lib/zod-resolver";
import { loginApi } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await loginApi(data);

      if (!result.success) {
        const errorMsg =
          result.error || "Gagal masuk. Periksa kembali email dan kata sandi Anda.";
        setServerError(errorMsg);
        toast.error("Gagal Masuk", {
          description: errorMsg,
        });
        return;
      }

      toast.success("Berhasil Masuk", {
        description: `Selamat datang, ${result.data?.user.name}! Mengalihkan ke dashboard...`,
      });

      // Redirect ke dashboard
      router.push("/dashboard");
      router.refresh();
    } catch {
      const networkError =
        "Terjadi gangguan koneksi saat menghubungi server. Silakan coba lagi.";
      setServerError(networkError);
      toast.error("Kesalahan Jaringan", {
        description: networkError,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setValue("email", "owner@pawcare.id", { shouldValidate: true });
    setValue("password", "Password123!", { shouldValidate: true });
    await onSubmit({ email: "owner@pawcare.id", password: "Password123!" });
  };

  return (
    <main className="theme-pawcare min-h-screen flex flex-col justify-center items-center bg-canvas px-4 py-12 font-brand text-ink">
      <div className="w-full max-w-md space-y-8">
        {/* Branding & Header */}
        <div className="text-center space-y-3">
          <Link
            href="/"
            aria-label="Kembali ke Beranda PawCare"
            className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
          >
            <img
              src="/images/brand/logo-pawcare-hijau.png"
              alt="PawCare Grooming"
              width={420}
              height={128}
              className="h-14 w-auto"
            />
          </Link>

          <div className="space-y-1">
            <h1 className="text-[1.75rem] font-bold tracking-tight text-forest sm:text-[2rem]">
              Admin Portal
            </h1>
            <p className="text-base text-ink-body">
              Masuk untuk mengelola operasional dan jadwal grooming
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="rounded-card-xl bg-white p-6 shadow-float ring-1 ring-inset ring-black/5 sm:p-8 space-y-6">
          {serverError && (
            <Alert variant="destructive" className="animate-in fade-in duration-200 rounded-card-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Perhatian</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Input Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-ink">
                Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@pawcare.id"
                  className={`pl-10 h-11 rounded-full bg-white text-base text-ink ${
                    errors.email ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive font-medium pl-2">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-ink">
                  Kata Sandi
                </Label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className={`pl-10 pr-10 h-11 rounded-full bg-white text-base text-ink ${
                    errors.password ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-muted hover:text-ink transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded-full my-1 mr-1"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive font-medium pl-2">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-medium rounded-full bg-forest hover:bg-forest-hover text-white transition-colors group cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk ke Dashboard
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-arch-line" />
              </div>
              <div className="relative flex justify-center text-xs font-medium text-ink-muted">
                <span className="bg-white px-2">Atau Akses Cepat Demo</span>
              </div>
            </div>

            {/* Quick Demo Login Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleQuickDemoLogin}
              className="w-full h-11 text-[15px] font-medium rounded-full ring-1 ring-inset ring-forest text-forest hover:bg-canvas-tint flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2"
            >
              <Sparkles className="h-4 w-4 text-forest" />
              <span>Masuk dengan User Dummy (Owner)</span>
            </button>

            {/* Dummy Account Info Box */}
            <div className="rounded-card-lg bg-canvas-tint p-3 text-center space-y-1 ring-1 ring-inset ring-arch-line">
              <p className="text-sm font-semibold text-ink flex items-center justify-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-forest" />
                <span>Akun Uji Coba Tersedia:</span>
              </p>
              <p className="text-sm text-ink-body font-mono">
                owner@pawcare.id &bull; Password123!
              </p>
            </div>
          </form>

          {/* Security guarantee */}
          <div className="pt-2 border-t border-arch-line flex items-center justify-center gap-2 text-sm text-ink-muted">
            <ShieldCheck className="h-4 w-4 text-forest shrink-0" />
            <span>Sesi aman terenkripsi dengan proteksi brute-force</span>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[15px] font-medium text-forest hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
          >
            &larr; Kembali ke Beranda PawCare
          </Link>
        </div>
      </div>

      <Toaster position="top-right" />
    </main>
  );
}
