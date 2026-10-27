"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Check, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFullDateIndo, formatLongDateIndo, formatWeekdayIndo } from "@/components/booking/date-format";

interface Step2DateSelectProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  maxAdvanceDays?: number;
  /** Hari mingguan (0=Minggu … 6=Sabtu) yang libur; ditandai dan tidak dapat dipilih. */
  closedDaysOfWeek?: number[];
}

/** Hari dalam seminggu (0=Minggu) untuk tanggal kalender "YYYY-MM-DD". */
function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
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

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

/**
 * Tahap 2 — Pilih Tanggal.
 *
 * Tampilan + keyboard saja. Rentang tanggal tetap [hari ini WIB, hari ini + maxAdvanceDays]
 * seperti sebelumnya; ketersediaan jam/hari tutup tetap ditentukan server dan
 * ditampilkan di Tahap 3. Tidak ada data jadwal yang dibuat di sini.
 */
export function Step2DateSelect({
  selectedDate,
  onSelectDate,
  maxAdvanceDays = 30,
  closedDaysOfWeek,
}: Step2DateSelectProps) {
  const closedSet = React.useMemo(() => new Set(closedDaysOfWeek ?? []), [closedDaysOfWeek]);
  const isClosedDate = React.useCallback(
    (dateStr: string) => closedSet.has(weekdayOf(dateStr)),
    [closedSet]
  );
  const todayStr = React.useMemo(() => getJakartaTodayStr(), []);
  const maxDateStr = React.useMemo(
    () => addDaysToJakartaDate(todayStr, maxAdvanceDays),
    [todayStr, maxAdvanceDays]
  );

  // Pilihan cepat: hari ini + 14 hari ke depan (dibatasi maxAdvanceDays)
  const quickDays = React.useMemo(() => {
    const days: string[] = [];
    const count = Math.min(14, maxAdvanceDays);
    for (let i = 0; i <= count; i++) {
      days.push(addDaysToJakartaDate(todayStr, i));
    }
    return days;
  }, [todayStr, maxAdvanceDays]);

  const chipRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Input kalender memegang teks mentahnya sendiri agar pengetikan manual tidak
  // terpotong; hanya tanggal VALID dalam rentang yang diteruskan ke wizard.
  const [rawDate, setRawDate] = React.useState<string>(selectedDate);
  const [inputError, setInputError] = React.useState<null | { kind: "range" | "closed"; day?: string }>(null);

  // Sinkronkan teks input bila tanggal berubah dari luar (mis. klik pilihan cepat).
  // Pola "simpan nilai sebelumnya" resmi React; tanggal kosong tidak menimpa ketikan.
  const [prevSelectedDate, setPrevSelectedDate] = React.useState<string>(selectedDate);
  if (selectedDate !== prevSelectedDate) {
    setPrevSelectedDate(selectedDate);
    if (selectedDate) {
      setRawDate(selectedDate);
      setInputError(null);
    }
  }

  const handleCalendarChange = (value: string) => {
    setRawDate(value);
    if (value === "") {
      setInputError(null);
      onSelectDate("");
      return;
    }
    if (value < todayStr || value > maxDateStr) {
      // Di luar rentang: jangan simpan tanggal (dan wizard ikut menghapus jam lama).
      setInputError({ kind: "range" });
      onSelectDate("");
      return;
    }
    if (isClosedDate(value)) {
      // Hari libur salon: sama seperti tanggal tak valid, pilihan dikosongkan.
      setInputError({ kind: "closed", day: formatWeekdayIndo(value) });
      onSelectDate("");
      return;
    }
    setInputError(null);
    onSelectDate(value);
  };

  const selectedIndex = quickDays.indexOf(selectedDate);
  const firstOpenIndex = Math.max(0, quickDays.findIndex((d) => !isClosedDate(d)));
  const tabbableIndex = selectedIndex >= 0 ? selectedIndex : firstOpenIndex;
  const hasClosedChip = quickDays.some((d) => isClosedDate(d));

  // Mencari chip berikutnya yang BUKAN hari libur ke arah tertentu (chip libur dilewati).
  const nextOpenIndex = (from: number, step: 1 | -1): number => {
    for (let i = from + step; i >= 0 && i < quickDays.length; i += step) {
      if (!isClosedDate(quickDays[i])) return i;
    }
    return from;
  };

  const moveSelection = (from: number, key: string) => {
    let next = from;
    if (key === "ArrowRight" || key === "ArrowDown") next = nextOpenIndex(from, 1);
    else if (key === "ArrowLeft" || key === "ArrowUp") next = nextOpenIndex(from, -1);
    else if (key === "Home") next = isClosedDate(quickDays[0]) ? nextOpenIndex(0, 1) : 0;
    else if (key === "End") {
      const last = quickDays.length - 1;
      next = isClosedDate(quickDays[last]) ? nextOpenIndex(last, -1) : last;
    } else return false;
    if (next === from && selectedDate === quickDays[from]) return true;
    chipRefs.current[next]?.focus();
    onSelectDate(quickDays[next]);
    return true;
  };

  const fullDateDisplay = selectedDate ? formatFullDateIndo(selectedDate) : "";

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold leading-snug text-ink sm:text-2xl">
          Pilih Tanggal Reservasi
        </h2>
        <p className="text-[15px] leading-6 text-ink-body">
          Reservasi dapat dilakukan untuk jadwal hingga {maxAdvanceDays} hari ke depan (WIB).
        </p>
      </div>

      {/* Pilihan cepat: grid yang membungkus (tanpa scroll horizontal) */}
      <div className="space-y-3">
        <p id="booking-quick-dates-label" className="text-sm font-semibold text-ink">
          Pilihan Cepat (2 Minggu Ke Depan)
        </p>
        {hasClosedChip && (
          <p className="text-[13px] leading-5 text-ink-muted">
            Tanggal berlabel “Libur” berarti salon tutup dan tidak dapat dipilih.
          </p>
        )}

        <div
          role="radiogroup"
          aria-labelledby="booking-quick-dates-label"
          className="grid grid-cols-3 gap-3 sm:grid-cols-5"
        >
          {quickDays.map((dateStr, index) => {
            const isSelected = selectedDate === dateStr;
            const isClosed = isClosedDate(dateStr);
            const { dayName, dateNum, label } = formatDayLabel(dateStr, todayStr);

            return (
              <button
                key={dateStr}
                ref={(el) => {
                  chipRefs.current[index] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={isClosed}
                tabIndex={index === tabbableIndex ? 0 : -1}
                onClick={() => !isClosed && onSelectDate(dateStr)}
                onKeyDown={(e) => {
                  if (moveSelection(index, e.key)) e.preventDefault();
                }}
                className={cn(
                  "relative flex min-h-[4.5rem] cursor-pointer flex-col items-center justify-center rounded-card-lg px-2 py-3 text-center transition-colors duration-150",
                  focusRing,
                  isClosed
                    ? "cursor-not-allowed border border-dashed border-ink-muted bg-white text-ink-muted"
                    : isSelected
                      ? "bg-forest text-white shadow-float"
                      : "bg-white text-ink ring-1 ring-inset ring-border hover:bg-canvas-tint hover:ring-forest/60"
                )}
              >
                <span
                  className={cn(
                    "text-[13px] font-semibold uppercase leading-none tracking-wide",
                    isSelected ? "text-white" : "text-ink-muted"
                  )}
                >
                  {label || dayName}
                </span>
                <span className="mt-1.5 text-base font-bold leading-none">{dateNum}</span>
                {isClosed && (
                  <span className="mt-1.5 text-[13px] font-medium leading-none">Libur</span>
                )}
                {isSelected && (
                  <Check
                    className="absolute right-2 top-2 size-4 text-white"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kalender bawaan browser: mouse, keyboard, dan layar sentuh (picker native) */}
      <div className="space-y-4 rounded-card-xl bg-white p-5 ring-1 ring-inset ring-border sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <label
              htmlFor="booking-date-input"
              className="flex items-center gap-2 text-[15px] font-semibold text-ink"
            >
              <CalendarIcon className="size-4 shrink-0 text-forest" aria-hidden="true" />
              <span>Atau Pilih Tanggal Melalui Kalender:</span>
            </label>
            <p id="booking-date-hint" className="text-[13px] leading-5 text-ink-muted">
              Mulai {formatLongDateIndo(todayStr)} sampai {formatLongDateIndo(maxDateStr)}
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <input
              id="booking-date-input"
              type="date"
              min={todayStr}
              max={maxDateStr}
              value={rawDate}
              onChange={(e) => handleCalendarChange(e.target.value)}
              aria-invalid={inputError ? true : undefined}
              aria-describedby={inputError ? "booking-date-hint booking-date-error" : "booking-date-hint"}
              className={cn(
                "min-h-12 w-full rounded-xl bg-white px-4 text-base font-medium text-ink ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:w-auto",
                inputError ? "ring-2 ring-destructive" : "ring-field-border"
              )}
            />
          </div>
        </div>

        {inputError && (
          <p
            id="booking-date-error"
            role="alert"
            className="flex items-start gap-2 text-[15px] font-medium leading-6 text-destructive"
          >
            <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <span>
              {inputError.kind === "closed"
                ? `Salon tutup pada hari ${inputError.day}. Silakan pilih tanggal lain.`
                : `Tanggal harus antara ${formatLongDateIndo(todayStr)} dan ${formatLongDateIndo(maxDateStr)}.`}
            </span>
          </p>
        )}

        {/* Tanggal terpilih: teks + ikon, tidak hanya warna */}
        {selectedDate && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-card-lg bg-canvas-tint p-4 ring-2 ring-inset ring-forest"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest text-white">
              <Check className="size-5" strokeWidth={3} aria-hidden="true" />
            </span>
            <div>
              <span className="block text-[13px] font-semibold uppercase leading-none tracking-wide text-forest-ink">
                Tanggal Terpilih
              </span>
              <span className="mt-1 block text-base font-bold leading-snug text-ink">
                {fullDateDisplay}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Catatan kebijakan */}
      <div className="flex items-start gap-3 rounded-card-lg bg-canvas-tint p-4 ring-1 ring-inset ring-border">
        <Info className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden="true" />
        <p className="text-[15px] leading-6 text-ink-body">
          Jadwal yang ditampilkan disesuaikan dengan jam operasional salon grooming dan waktu istirahat staf. Slot waktu detail akan dimuat pada langkah berikutnya.
        </p>
      </div>
    </div>
  );
}
