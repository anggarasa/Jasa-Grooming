"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  PawPrint,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { loginSchema, type LoginInput } from "@/modules/auth/schemas";
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

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background selection:bg-accent/20 selection:text-accent">
      <div className="w-full max-w-md space-y-8">
        {/* Branding & Header */}
        <div className="text-center space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-secondary border border-secondary hover:bg-secondary-hover transition-colors shadow-xs"
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <PawPrint className="h-5 w-5" />
            </div>
            <span className="font-bold text-primary tracking-tight text-lg">
              PawCare Grooming
            </span>
          </Link>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Admin Portal
            </h1>
            <p className="text-sm text-muted-foreground">
              Masuk untuk mengelola operasional dan jadwal grooming
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-card text-card-foreground border border-card-border rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          {serverError && (
            <Alert variant="destructive" className="animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Perhatian</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Input Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@pawcare.id"
                  className={`pl-10 h-11 ${
                    errors.email ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Kata Sandi
                </Label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className={`pl-10 pr-10 h-11 ${
                    errors.password ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm my-1 mr-1"
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
                <p id="password-error" className="text-xs text-destructive font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-foreground shadow-md transition-all group"
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
          </form>

          {/* Security guarantee */}
          <div className="pt-2 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
            <span>Sesi aman terenkripsi dengan proteksi brute-force</span>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
          >
            ← Kembali ke Beranda PawCare
          </Link>
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
