"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  React.useEffect(() => {
    console.error("Dashboard Route Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4 shadow-2xs">
        <AlertCircle className="h-7 w-7" aria-hidden="true" />
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
        Gagal Memuat Halaman Dashboard
      </h1>

      <p className="mt-2 text-sm text-muted-foreground max-w-md leading-relaxed">
        Terjadi kesalahan saat memuat modul operasional dashboard. Silakan muat ulang atau kembali ke ringkasan utama.
      </p>

      {error.digest && (
        <p className="mt-1 text-[11px] font-mono text-muted-foreground/70">
          Kode Error: {error.digest}
        </p>
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
        <Button
          onClick={() => reset()}
          variant="default"
          size="sm"
          className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <RotateCcw className="h-4 w-4 mr-1.5" aria-hidden="true" />
          Coba Lagi
        </Button>

        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">
            <LayoutDashboard className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Kembali ke Ringkasan
          </Link>
        </Button>
      </div>
    </div>
  );
}
