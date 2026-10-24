"use client";

import * as React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-xl text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Terjadi Kesalahan Sistem
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Aplikasi mengalami kendala fatal. Tim operasional telah menerima notifikasi insiden ini.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-slate-400">
              ID Insiden: {error.digest}
            </p>
          )}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Muat Ulang Aplikasi</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
