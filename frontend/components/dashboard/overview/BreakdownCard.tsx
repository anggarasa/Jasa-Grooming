import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface BreakdownRow {
  label: string;
  value: number;
  /** Warna titik & segmen bilah. */
  color: string;
  /** Teks tambahan di kanan nilai (mis. pendapatan). */
  hint?: string;
}

interface BreakdownCardProps {
  icon: React.ElementType;
  title: string;
  /** Judul angka besar, mis. "Total janji". */
  totalLabel: string;
  totalValue: string;
  rows: BreakdownRow[];
  emptyText: string;
}

/**
 * Kartu rincian bergaya "Revenue by Category" pada referensi: angka total, bilah
 * bertumpuk yang segmennya sebanding dengan nilai tiap baris, lalu daftar baris
 * dengan titik warna dan jumlahnya.
 */
export function BreakdownCard({
  icon: Icon,
  title,
  totalLabel,
  totalValue,
  rows,
  emptyText,
}: BreakdownCardProps) {
  const sum = rows.reduce((acc, row) => acc + row.value, 0);

  return (
    <Card className="border-border">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground"
        >
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>

      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-xs text-muted-foreground">{totalLabel}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{totalValue}</p>
        </div>

        {sum > 0 ? (
          <div
            role="img"
            aria-label={rows
              .filter((row) => row.value > 0)
              .map((row) => `${row.label} ${row.value}`)
              .join(", ")}
            className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted"
          >
            {rows
              .filter((row) => row.value > 0)
              .map((row) => (
                <span
                  key={row.label}
                  className="block h-full first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${(row.value / sum) * 100}%`, backgroundColor: row.color }}
                />
              ))}
          </div>
        ) : (
          <div className="h-2.5 w-full rounded-full bg-muted" aria-hidden="true" />
        )}

        {rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center gap-3 py-2.5 text-sm">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                <span className="min-w-0 flex-1 truncate text-foreground">{row.label}</span>
                {row.hint && (
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                    {row.hint}
                  </span>
                )}
                <span className="shrink-0 font-semibold tabular-nums text-foreground">{row.value}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
