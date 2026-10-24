"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicError({ error, reset }: PublicErrorProps) {
  React.useEffect(() => {
    // Log error cleanly for telemetry/debugging
    console.error("Public Route Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive mb-4 shadow-xs">
        <AlertTriangle className="h-8 w-8" aria-hidden="true" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
        Terjadi Kendala Memuat Halaman
      </h1>

      <p className="mt-2 text-sm text-muted-foreground max-w-md leading-relaxed">
        Mohon maaf atas ketidaknyamanan ini. Terjadi kesalahan sementara saat memuat data dari server.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Button
          onClick={() => reset()}
          variant="accent"
          size="default"
          className="font-semibold"
        >
          <RotateCcw className="h-4 w-4 mr-1.5" aria-hidden="true" />
          Coba Muat Ulang
        </Button>

        <Button asChild variant="outline" size="default">
          <Link href="/">
            <Home className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Kembali ke Beranda
          </Link>
        </Button>
      </div>
    </div>
  );
}
