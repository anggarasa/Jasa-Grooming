"use client";

import * as React from "react";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatIDR } from "@/lib/utils";
import { formatIndonesianDate } from "@/lib/format-date";
import type { DayPoint } from "@backend/modules/bookings/dashboard-stats";

type Range = 7 | 14;

interface ReportChartProps {
  /** Deret harian (14 titik: 6 hari lalu s/d 7 hari ke depan, WIB). */
  series: DayPoint[];
}

/** Tinggi minimum area batang; selebihnya mengikuti tinggi kartu (kartu sejajar gauge). */
const CHART_MIN_HEIGHT = 232;

function longDate(date: string) {
  return formatIndonesianDate(`${date}T12:00:00+07:00`, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: undefined,
    minute: undefined,
  });
}

/**
 * Laporan reservasi per hari. Batang = jumlah reservasi aktif (bukan Dibatalkan /
 * Tidak Hadir); garis putus-putus = estimasi pendapatan reservasi aktif hari itu.
 * Garis diskalakan terhadap nilai tertinggi PADA PERIODE YANG TAMPIL (tidak punya
 * sumbu sendiri); angka sebenarnya selalu ada di tooltip dan label aksesibilitas.
 * Dibuat dari elemen HTML + satu SVG tanpa pustaka grafik.
 */
export function ReportChart({ series }: ReportChartProps) {
  const [range, setRange] = React.useState<Range>(14);
  const [hover, setHover] = React.useState<number | null>(null);

  const visible = React.useMemo(() => {
    if (range === 14) return series;
    const todayIndex = Math.max(0, series.findIndex((p) => p.isToday));
    const start = Math.min(Math.max(0, todayIndex - 3), Math.max(0, series.length - 7));
    return series.slice(start, start + 7);
  }, [series, range]);

  const n = visible.length;
  const sumActive = visible.reduce((acc, p) => acc + p.active, 0);
  const sumRevenue = visible.reduce((acc, p) => acc + p.revenue, 0);
  const maxActive = Math.max(0, ...visible.map((p) => p.active));
  const maxRevenue = Math.max(0, ...visible.map((p) => p.revenue));

  const niceMax = Math.max(4, Math.ceil(maxActive / 4) * 4);
  const ticks = [0, 1, 2, 3, 4].map((k) => (niceMax / 4) * k);

  const linePoints = visible.map((p, i) => {
    const x = ((i + 0.5) / n) * 100;
    const y = maxRevenue > 0 ? 100 - (p.revenue / maxRevenue) * 88 - 6 : 100;
    return { x, y };
  });
  const path = linePoints.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`).join(" ");

  const active = hover !== null ? visible[hover] : null;

  return (
    <Card className="flex h-full flex-col border-border">
      <div className="flex flex-col gap-4 p-5 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground"
            >
              <BarChart3 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">Laporan Reservasi</h2>
              <p className="text-xs text-muted-foreground">
                Reservasi aktif per hari dan estimasi pendapatannya
              </p>
            </div>
          </div>

          <dl className="flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: "var(--chart-bar-top)" }}
                />
                Total reservasi aktif
              </dt>
              <dd className="text-xl font-semibold tracking-tight text-foreground">{sumActive}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="inline-block h-0 w-4 border-t-2 border-dotted"
                  style={{ borderColor: "var(--chart-line)" }}
                />
                Estimasi pendapatan
              </dt>
              <dd className="text-xl font-semibold tracking-tight text-foreground">
                {formatIDR(sumRevenue)}
              </dd>
            </div>
          </dl>
        </div>

        <div
          role="group"
          aria-label="Rentang laporan"
          className="inline-flex shrink-0 self-start rounded-xl border border-border bg-muted p-1"
        >
          {([7, 14] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={range === value}
              onClick={() => {
                setRange(value);
                setHover(null);
              }}
              className={cn(
                "motion-admin-press rounded-lg px-3.5 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                range === value
                  ? "bg-card text-foreground shadow-[var(--shadow-admin-nav)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {value} hari
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-x-auto px-5 pb-5 pt-2">
        <div className="flex min-w-[520px] flex-1 flex-col">
          <div className="flex flex-1" style={{ minHeight: CHART_MIN_HEIGHT }}>
            {/* Sumbu jumlah reservasi */}
            <div
              aria-hidden="true"
              className="relative w-9 shrink-0 text-[11px] text-muted-foreground"
            >
              {ticks.map((tick, i) => (
                <span
                  key={tick}
                  className="absolute right-2 -translate-y-1/2 tabular-nums"
                  style={{ top: `${100 - (i / 4) * 100}%` }}
                >
                  {tick}
                </span>
              ))}
            </div>

            <div className="relative flex-1">
              {/* Garis bantu */}
              {ticks.map((tick, i) => (
                <div
                  key={tick}
                  aria-hidden="true"
                  className="absolute inset-x-0 border-t border-dashed"
                  style={{ top: `${100 - (i / 4) * 100}%`, borderColor: "var(--chart-grid)" }}
                />
              ))}

              {/* Batang */}
              <div
                className="absolute inset-0 grid"
                style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
              >
                {visible.map((point, i) => {
                  const heightPct = (point.active / niceMax) * 100;
                  const label = `${longDate(point.date)}: ${point.active} reservasi aktif, estimasi pendapatan ${formatIDR(point.revenue)}`;
                  return (
                    <button
                      key={point.date}
                      type="button"
                      aria-label={label}
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      className="group relative flex h-full items-end justify-center focus-visible:outline-none"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute inset-y-0 inset-x-0.5 rounded-lg opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
                          "bg-muted/70"
                        )}
                      />
                      <span
                        aria-hidden="true"
                        className="motion-admin-grow relative block w-[58%] max-w-10 rounded-[10px]"
                        style={
                          {
                            height: point.active === 0 ? 4 : `${Math.max(heightPct, 3)}%`,
                            background: point.isToday
                              ? "linear-gradient(to bottom, #2E7A62, var(--chart-bar-strong))"
                              : point.active === 0
                                ? "var(--chart-tick-off)"
                                : "linear-gradient(to bottom, var(--chart-bar-top), var(--chart-bar-bottom))",
                            "--i": i,
                          } as React.CSSProperties
                        }
                      />
                    </button>
                  );
                })}
              </div>

              {/* Garis estimasi pendapatan */}
              {maxRevenue > 0 && (
                <>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="motion-admin-tick pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                  >
                    <path
                      d={path}
                      fill="none"
                      stroke="var(--chart-line)"
                      strokeWidth="2"
                      strokeDasharray="1 5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  {linePoints.map((pt, i) => (
                    <span
                      key={visible[i].date}
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-card bg-[var(--chart-line)] transition-transform",
                        hover === i && "scale-150"
                      )}
                      style={{ left: `${pt.x}%`, bottom: `${100 - pt.y}%` }}
                    />
                  ))}
                </>
              )}

              {/* Penanda & tooltip saat disorot */}
              {active && hover !== null && (
                <>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 w-px bg-primary/30"
                    style={{ left: `${((hover + 0.5) / n) * 100}%` }}
                  />
                  <div
                    role="status"
                    className="pointer-events-none absolute top-1 z-10 w-52 -translate-x-1/2 rounded-xl border border-border bg-card p-3 text-xs shadow-[var(--shadow-admin-raised)]"
                    style={{ left: `clamp(104px, ${((hover + 0.5) / n) * 100}%, calc(100% - 104px))` }}
                  >
                    <p className="mb-2 font-semibold text-foreground">{longDate(active.date)}</p>
                    <dl className="space-y-1.5 text-muted-foreground">
                      <div className="flex justify-between gap-3">
                        <dt>Reservasi aktif</dt>
                        <dd className="font-semibold text-foreground">{active.active}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Selesai</dt>
                        <dd className="font-semibold text-foreground">{active.completed}</dd>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-border pt-1.5">
                        <dt>Estimasi pendapatan</dt>
                        <dd className="font-semibold text-primary">{formatIDR(active.revenue)}</dd>
                      </div>
                    </dl>
                  </div>
                </>
              )}

              {sumActive === 0 && (
                <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-muted-foreground">
                  Belum ada reservasi aktif pada periode ini.
                </p>
              )}
            </div>
          </div>

          {/* Sumbu hari */}
          <div className="flex pt-2">
            <div className="w-9 shrink-0" aria-hidden="true" />
            <div
              aria-hidden="true"
              className="grid flex-1"
              style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
            >
              {visible.map((point) => (
                <div
                  key={point.date}
                  className={cn(
                    "flex flex-col items-center text-[11px] leading-tight",
                    point.isToday ? "font-semibold text-primary" : "text-muted-foreground"
                  )}
                >
                  <span>{point.weekday}</span>
                  <span className="tabular-nums">{point.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
