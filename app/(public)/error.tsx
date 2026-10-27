"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface PublicErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicError({ error, reset }: PublicErrorProps) {
  React.useEffect(() => {
    // Log error cleanly for telemetry/debugging
    console.error("Public Route Error:", error);
  }, [error]);

  const focus =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2";

  return (
    <div className="theme-pawcare flex min-h-[60vh] flex-col items-center justify-center bg-canvas px-4 py-16 text-center">
      <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-destructive-subtle text-destructive">
        <AlertTriangle className="size-8" aria-hidden="true" />
      </span>

      <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-forest sm:text-[2.25rem]">
        Terjadi Kendala Memuat Halaman
      </h1>

      <p className="mt-3 max-w-md text-base leading-7 text-ink-body">
        Mohon maaf atas ketidaknyamanan ini. Terjadi kesalahan sementara saat memuat data dari server.
      </p>

      <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => reset()}
          className={`inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-forest px-6 text-base font-medium text-white transition-colors hover:bg-forest-hover ${focus}`}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Coba Muat Ulang
        </button>

        <Link
          href="/"
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-medium text-forest ring-1 ring-inset ring-forest transition-colors hover:bg-canvas-tint ${focus}`}
        >
          <Home className="size-4" aria-hidden="true" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
