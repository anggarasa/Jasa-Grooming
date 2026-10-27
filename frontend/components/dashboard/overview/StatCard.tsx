import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DeltaTone = "up" | "down" | "flat" | "none";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  /** Nilai utama, sudah diformat. */
  value: string;
  /** Teks pembanding di bawah nilai (mis. "+2 dibanding kemarin"). */
  caption: string;
  tone?: DeltaTone;
  /** Deret nilai (14 hari) untuk batang mini di kanan. Kosong = tanpa batang. */
  series?: number[];
  /** Indeks batang yang menandai hari ini. */
  highlightIndex?: number;
  /** Deskripsi batang mini untuk pembaca layar. */
  seriesLabel?: string;
}

const TONE_CLASS: Record<DeltaTone, string> = {
  up: "text-primary",
  down: "text-destructive",
  flat: "text-muted-foreground",
  none: "text-muted-foreground",
};

/**
 * Kartu ringkasan bergaya referensi: ubin ikon di kiri atas, label, angka besar,
 * teks pembanding, dan batang mini di kanan. Batang mini dibuat dari deret data nyata
 * (14 hari), bukan hiasan acak; tinggi tiap batang proporsional terhadap nilai tertinggi.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  caption,
  tone = "none",
  series,
  highlightIndex,
  seriesLabel,
}: StatCardProps) {
  const max = series && series.length ? Math.max(...series, 0) : 0;

  return (
    <Card className="motion-admin-lift border-border">
      <CardContent className="space-y-4 p-5">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground"
        >
          <Icon className="h-5 w-5" />
        </span>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex items-end justify-between gap-3">
            <p
              className={cn(
                "min-w-0 font-semibold leading-none tracking-tight text-foreground",
                // Angka rupiah panjang (mis. "Rp 1.250.000") mengecil agar tidak menabrak batang mini.
                value.length > 8 ? "text-[21px] sm:text-[22px]" : "text-[26px] sm:text-[28px]"
              )}
            >
              {value}
            </p>

            {series && series.length > 0 && (
              <div
                role="img"
                aria-label={seriesLabel ?? `Grafik mini ${label}, ${series.length} hari`}
                className="flex h-12 shrink-0 items-end gap-[2.5px]"
              >
                {series.map((point, index) => {
                  const height = max > 0 ? Math.max(12, Math.round((point / max) * 100)) : 12;
                  const strong = index === highlightIndex;
                  return (
                    <span
                      key={index}
                      className="motion-admin-grow block w-[3.5px] rounded-full"
                      style={
                        {
                          height: `${point === 0 ? 8 : height}%`,
                          backgroundColor: strong
                            ? "var(--chart-bar-strong)"
                            : point === 0
                              ? "var(--chart-tick-off)"
                              : "var(--chart-bar-top)",
                          "--i": index,
                        } as React.CSSProperties
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
          <p className={cn("pt-1 text-xs font-medium", TONE_CLASS[tone])}>{caption}</p>
        </div>
      </CardContent>
    </Card>
  );
}
