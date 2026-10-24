import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="space-y-4 max-w-xl">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-10 w-3/4 rounded-xl" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-2/3 rounded-md" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <Skeleton className="aspect-[16/10] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-2/3 rounded-md" />
              <Skeleton className="h-3 w-full rounded-sm" />
              <Skeleton className="h-3 w-4/5 rounded-sm" />
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
