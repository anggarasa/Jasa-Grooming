import * as React from "react";
import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LegendItem {
  label: string;
  value: number;
  /** Warna titik legenda. */
  color: string;
}

interface ProgressGaugeProps {
  title: string;
  /** 0–100: porsi tick yang menyala. */
  percent: number;
  centerLabel: string;
  centerValue: string;
  legend: LegendItem[];
  footnote: string;
  href: string;
  linkLabel: string;
}

const TICKS = 56;
const START_DEG = -140;
const SWEEP_DEG = 280;
const FROM = [158, 216, 192]; // #9ED8C0 (mint)
const TO = [27, 92, 73]; // #1B5C49 (forest)

function tickColor(index: number) {
  const t = TICKS <= 1 ? 1 : index / (TICKS - 1);
  const c = FROM.map((from, i) => Math.round(from + (TO[i] - from) * t));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

/**
 * Gauge garis-garis (mengikuti gambar referensi). Jumlah garis menyala = persentase
 * yang diberikan; warnanya bergradasi dari mint ke hijau merek. Persentase dihitung
 * dari data nyata oleh pemanggil — komponen ini hanya menggambar.
 */
export function ProgressGauge({
  title,
  percent,
  centerLabel,
  centerValue,
  legend,
  footnote,
  href,
  linkLabel,
}: ProgressGaugeProps) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));
  const lit = Math.round((safe / 100) * TICKS);

  return (
    <Card className="flex h-full flex-col border-border">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground"
        >
          <Wallet className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>

      <CardContent className="flex flex-1 flex-col items-center gap-4 p-5">
        <div
          role="img"
          aria-label={`${safe}% janji hari ini selesai`}
          className="relative aspect-square w-full max-w-[260px]"
        >
          <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden="true">
            {Array.from({ length: TICKS }, (_, i) => {
              const angle = START_DEG + (SWEEP_DEG * i) / (TICKS - 1);
              const on = i < lit;
              return (
                <line
                  key={i}
                  x1="120"
                  y1="14"
                  x2="120"
                  y2={on ? 38 : 34}
                  stroke={on ? tickColor(i) : "var(--chart-tick-off)"}
                  strokeWidth={on ? 4.4 : 3.6}
                  strokeLinecap="round"
                  transform={`rotate(${angle} 120 120)`}
                  className={on ? "motion-admin-tick" : undefined}
                  style={{ "--i": i } as React.CSSProperties}
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pt-2 text-center">
            <span
              aria-hidden="true"
              className="mb-1 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-[var(--shadow-admin-card)]"
            >
              <span className="text-sm font-semibold text-primary">{safe}%</span>
            </span>
            <span className="text-xs text-muted-foreground">{centerLabel}</span>
            <span className="text-xl font-semibold tracking-tight text-foreground">{centerValue}</span>
          </div>
        </div>

        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
              <span className="font-semibold text-foreground">{item.value}</span>
            </li>
          ))}
        </ul>

        <p className="text-center text-xs text-muted-foreground">{footnote}</p>

        <Link
          href={href}
          className="motion-admin-press group mt-auto flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 motion-safe:transition-transform group-hover:translate-x-0.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
