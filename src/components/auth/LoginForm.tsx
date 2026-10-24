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
import { loginSchema, type LoginInput } from "@/modules/auth/schemas";
import { zodResolver } from "@/lib/zod-resolver";
import { loginApi } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BrandLogo } from "@/components/common/BrandLogo";

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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F5F6F3] text-black">
      <div className="w-full max-w-md space-y-8">
        {/* Branding & Header */}
        <div className="text-center space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-[#E2E6DF] hover:bg-slate-50 transition-all shadow-2xs"
          >
            <BrandLogo size="sm" businessName="PawCare Grooming" subtitle="ADMIN PORTAL" />
          </Link>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black uppercase">
              Admin Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Masuk untuk mengelola operasional dan jadwal grooming
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-[#E2E6DF] rounded-[26px] shadow-sm p-6 sm:p-8 space-y-6">
          {serverError && (
            <Alert variant="destructive" className="animate-in fade-in duration-200 rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Perhatian</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Input Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@pawcare.id"
                  className={`pl-10 h-11 rounded-full border-[#E2E6DF] bg-[#F9FAF8] focus:bg-white text-black text-sm ${
                    errors.email ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive font-medium pl-2">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Kata Sandi
                </Label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className={`pl-10 pr-10 h-11 rounded-full border-[#E2E6DF] bg-[#F9FAF8] focus:bg-white text-black text-sm ${
                    errors.password ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-black transition-colors cursor-pointer focus-visible:outline-none rounded-full my-1 mr-1"
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
                <p id="password-error" className="text-xs text-destructive font-medium pl-2">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-sm font-black rounded-full bg-[#111827] hover:bg-black text-white shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
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
                <div className="w-full border-t border-[#E2E6DF]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-slate-400">
                <span className="bg-white px-2">Atau Akses Cepat Demo</span>
              </div>
            </div>

            {/* Quick Demo Login Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleQuickDemoLogin}
              className="w-full h-11 text-xs font-bold rounded-full border border-slate-300 hover:bg-slate-50 text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 text-[#15803D]" />
              <span>Masuk dengan User Dummy (Owner)</span>
            </button>

            {/* Dummy Account Info Box */}
            <div className="p-3 rounded-2xl bg-[#F7F8F6] border border-[#E2E6DF] text-center space-y-1">
              <p className="text-[11px] font-bold text-black flex items-center justify-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Akun Uji Coba Tersedia:</span>
              </p>
              <p className="text-[11px] text-slate-600 font-mono">
                owner@pawcare.id &bull; Password123!
              </p>
            </div>
          </form>

          {/* Security guarantee */}
          <div className="pt-2 border-t border-[#F0F2EE] flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Sesi aman terenkripsi dengan proteksi brute-force</span>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs font-bold text-slate-500 hover:text-black transition-colors inline-flex items-center gap-1.5"
          >
            &larr; Kembali ke Beranda PawCare
          </Link>
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
