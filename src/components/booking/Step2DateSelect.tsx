"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Info, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step2DateSelectProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  maxAdvanceDays?: number;
}

function getJakartaTodayStr(): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
}

function addDaysToJakartaDate(baseDateStr: string, days: number): string {
  const [y, m, d] = baseDateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  const newY = dt.getUTCFullYear();
  const newM = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const newD = String(dt.getUTCDate()).padStart(2, "0");
  return `${newY}-${newM}-${newD}`;
}

function formatDayLabel(dateStr: string, todayStr: string): { dayName: string; dateNum: string; label: string } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  
  const dayName = new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    timeZone: "Asia/Jakarta",
  }).format(dt);

  const dateNum = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(dt);

  let label = "";
  if (dateStr === todayStr) {
    label = "Hari Ini";
  } else if (dateStr === addDaysToJakartaDate(todayStr, 1)) {
    label = "Besok";
  }

  return { dayName, dateNum, label };
}

function formatFullDateIndo(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(dt);
}

export function Step2DateSelect({
  selectedDate,
  onSelectDate,
  maxAdvanceDays = 30,
}: Step2DateSelectProps) {
  const todayStr = React.useMemo(() => getJakartaTodayStr(), []);
  const maxDateStr = React.useMemo(
    () => addDaysToJakartaDate(todayStr, maxAdvanceDays),
    [todayStr, maxAdvanceDays]
  );

  // Generate next 14 quick days pills
  const quickDays = React.useMemo(() => {
    const days: string[] = [];
    const count = Math.min(14, maxAdvanceDays);
    for (let i = 0; i <= count; i++) {
      days.push(addDaysToJakartaDate(todayStr, i));
    }
    return days;
  }, [todayStr, maxAdvanceDays]);

  const fullDateDisplay = selectedDate ? formatFullDateIndo(selectedDate) : "";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Pilih Tanggal Reservasi
        </h2>
        <p className="text-sm text-muted-foreground">
          Reservasi dapat dilakukan untuk jadwal hingga {maxAdvanceDays} hari ke depan (WIB).
        </p>
      </div>

      {/* Quick Selection Carousel / Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pilihan Cepat (2 Minggu Ke Depan)
          </label>
        </div>

        {/* Scrollable Horizontal Pill List */}
        <div className="relative">
          <div
            role="radiogroup"
            aria-label="Pilihan cepat tanggal reservasi"
            className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-border focus:outline-none"
          >
            {quickDays.map((dateStr) => {
              const isSelected = selectedDate === dateStr;
              const { dayName, dateNum, label } = formatDayLabel(dateStr, todayStr);

              return (
                <button
                  key={dateStr}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelectDate(dateStr)}
                  className={cn(
                    "flex flex-col items-center justify-center shrink-0 min-w-[76px] rounded-xl border p-2.5 transition-all duration-200 cursor-pointer outline-none",
                    isSelected
                      ? "border-accent bg-accent text-white shadow-xs scale-102"
                      : "border-border bg-card text-foreground hover:border-accent/60 hover:bg-muted focus-visible:ring-2 focus-visible:ring-accent"
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      isSelected ? "text-white/90" : "text-muted-foreground"
                    )}
                  >
                    {label || dayName}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-extrabold my-0.5",
                      isSelected ? "text-white" : "text-foreground"
                    )}
                  >
                    {dateNum}
                  </span>
                  {isSelected && (
                    <span className="mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/20">
                      <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Manual Date Input Picker */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <label
              htmlFor="booking-date-input"
              className="text-sm font-semibold text-foreground flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>Atau Pilih Tanggal Melalui Kalender:</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Mulai {todayStr} sampai {maxDateStr}
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <input
              id="booking-date-input"
              type="date"
              min={todayStr}
              max={maxDateStr}
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground shadow-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Selected Date Callout */}
        {selectedDate && (
          <div className="rounded-xl border border-accent/30 bg-accent-subtle/40 p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
              <CalendarIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-accent uppercase tracking-wider block">
                Tanggal Terpilih
              </span>
              <span className="text-sm sm:text-base font-bold text-primary">
                {fullDateDisplay}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Helpful Policy Note */}
      <div className="rounded-xl border border-border bg-muted/40 p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          Jadwal yang ditampilkan disesuaikan dengan jam operasional salon grooming dan waktu istirahat staf. Slot waktu detail akan dimuat pada langkah berikutnya.
        </p>
      </div>
    </div>
  );
}
