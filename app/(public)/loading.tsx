import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/** Kerangka pemuatan: meniru hero dan grid kartu foto agar tidak ada loncatan tata letak. */
export default function PublicLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Memuat halaman"
      className="bg-canvas"
    >
      <span className="sr-only">Memuat halaman…</span>
      <div className="mx-auto w-full max-w-[1304px] space-y-4 px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-36 rounded-full bg-canvas-tint motion-reduce:animate-none" />
        <Skeleton className="h-12 w-3/4 max-w-xl rounded-card-lg bg-canvas-tint motion-reduce:animate-none" />
        <Skeleton className="h-5 w-full max-w-2xl rounded-full bg-canvas-tint motion-reduce:animate-none" />
        <Skeleton className="h-5 w-2/3 max-w-xl rounded-full bg-canvas-tint motion-reduce:animate-none" />
      </div>

      <div className="bg-white">
        <div className="mx-auto grid w-full max-w-[1304px] grid-cols-1 gap-x-5 gap-y-7 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="aspect-[5/6] min-h-[320px] w-full rounded-card-xl bg-canvas-tint motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
