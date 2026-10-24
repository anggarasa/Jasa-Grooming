"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  CalendarOff,
  Loader2,
  Ban,
  PawPrint,
} from "lucide-react";
import { formatIndonesianDate } from "@/lib/format-date";
import { Button } from "@/components/ui/button";
import {
  BookingStatusBadge,
} from "@/components/dashboard/bookings/BookingStatusBadge";
import {
  BookingListItem,
  CalendarBlockedTimeItem,
} from "@/modules/bookings/admin-ui.types";

type CalendarViewMode = "day" | "week" | "month";

interface CalendarViewProps {
  initialDate?: string; // YYYY-MM-DD
}

export function CalendarView({ initialDate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState<Date>(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  const [viewMode, setViewMode] = React.useState<CalendarViewMode>("week");
  const [bookings, setBookings] = React.useState<BookingListItem[]>([]);
  const [blockedTimes, setBlockedTimes] = React.useState<CalendarBlockedTimeItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState<number>(0);

  // Helper date formatting
  const toYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Hitung rentang start dan end berdasarkan viewMode
  const { startStr, endStr, titleLabel } = React.useMemo(() => {
    const target = new Date(currentDate);

    if (viewMode === "day") {
      const dayStr = toYYYYMMDD(target);
      const title = formatIndonesianDate(target, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return { startStr: dayStr, endStr: dayStr, titleLabel: title };
    }

    if (viewMode === "week") {
      // Minggu dimulai dari Senin (ISO)
      const day = target.getDay();
      const diff = target.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(target.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const sStr = toYYYYMMDD(monday);
      const eStr = toYYYYMMDD(sunday);

      const title = `${formatIndonesianDate(monday, {
        day: "numeric",
        month: "short",
      })} - ${formatIndonesianDate(sunday, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;

      return { startStr: sStr, endStr: eStr, titleLabel: title };
    }

    // Month
    const year = target.getFullYear();
    const month = target.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const sStr = toYYYYMMDD(firstDay);
    const eStr = toYYYYMMDD(lastDay);

    const title = formatIndonesianDate(firstDay, {
      month: "long",
      year: "numeric",
    });

    return { startStr: sStr, endStr: eStr, titleLabel: title };
  }, [currentDate, viewMode]);

  // Fetch events
  React.useEffect(() => {
    let isSubscribed = true;

    const loadEvents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/admin/calendar/events?start=${encodeURIComponent(
            startStr
          )}&end=${encodeURIComponent(endStr)}`
        );
        const json = await res.json();

        if (!isSubscribed) return;

        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Gagal memuat jadwal kalender.");
        }

        setBookings(json.data.bookings || []);
        setBlockedTimes(json.data.blockedTimes || []);
      } catch (err: unknown) {
        if (!isSubscribed) return;
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
        setError(msg);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      isSubscribed = false;
    };
  }, [startStr, endStr, refreshKey]);

  // Navigasi Prev/Next/Today
  const handleNavigate = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      setCurrentDate(new Date());
      return;
    }

    const next = new Date(currentDate);
    const step = direction === "next" ? 1 : -1;

    if (viewMode === "day") {
      next.setDate(next.getDate() + step);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() + step * 7);
    } else {
      next.setMonth(next.getMonth() + step);
    }

    setCurrentDate(next);
  };

  // Helper render booking items
  const renderBookingItem = (b: BookingListItem) => {
    const startHourStr = formatIndonesianDate(b.startAt, {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endHourStr = formatIndonesianDate(b.endAt, {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <Link
        key={b.id}
        href={`/dashboard/bookings/${b.id}`}
        className="block p-2 rounded-lg border bg-card hover:bg-muted/40 hover:border-primary/50 transition-all text-xs shadow-2xs group"
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="font-semibold text-primary font-mono text-[11px]">
            #{b.bookingCode}
          </span>
          <BookingStatusBadge status={b.status} className="scale-90 origin-right" />
        </div>

        <div className="font-medium text-foreground flex items-center gap-1">
          <PawPrint className="h-3 w-3 text-accent shrink-0" />
          <span className="truncate">
            {b.pet?.name} ({b.customer?.name})
          </span>
        </div>

        <div className="text-muted-foreground text-[11px] flex items-center justify-between mt-1">
          <span className="truncate">{b.service?.name}</span>
          <span className="font-semibold shrink-0">
            {startHourStr} - {endHourStr}
          </span>
        </div>
      </Link>
    );
  };

  // Helper render blocked time item
  const renderBlockedItem = (bt: CalendarBlockedTimeItem) => {
    const startHourStr = formatIndonesianDate(bt.startAt, {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endHourStr = formatIndonesianDate(bt.endAt, {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div
        key={bt.id}
        className="p-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200"
      >
        <div className="flex items-center gap-1 font-semibold text-[11px]">
          <Ban className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          <span>Waktu Diblokir ({startHourStr} - {endHourStr})</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {bt.reason}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-card border rounded-xl shadow-2xs">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleNavigate("today")}
            className="text-xs h-8 font-semibold"
          >
            Hari Ini
          </Button>

          <div className="flex items-center border rounded-md">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate("prev")}
              className="h-8 w-8 p-0"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate("next")}
              className="h-8 w-8 p-0"
              aria-label="Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="text-sm sm:text-base font-bold text-foreground pl-2">
            {titleLabel}
          </h2>

          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-accent ml-2" />
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => setViewMode("day")}
              className={`px-3 py-1 text-xs rounded-sm font-semibold transition-all ${
                viewMode === "day"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Harian
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 text-xs rounded-sm font-semibold transition-all ${
                viewMode === "week"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mingguan
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 text-xs rounded-sm font-semibold transition-all ${
                viewMode === "month"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bulanan
            </button>
          </div>

          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-white h-8 text-xs">
            <Link href="/dashboard/bookings/new">
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              Walk-in
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link href="/dashboard/blocked-times">
              <CalendarOff className="h-3.5 w-3.5 mr-1" />
              Blokir Waktu
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border flex items-center justify-between">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={() => setRefreshKey((k) => k + 1)} className="h-7 text-xs">
            Muat Ulang
          </Button>
        </div>
      )}

      {/* Main Grid View */}
      <div className="bg-card border rounded-xl p-4 shadow-2xs min-h-[450px]">
        {/* DAY VIEW */}
        {viewMode === "day" && (
          <div className="space-y-4">
            <div className="border-b pb-2 flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground">
                Jadwal Hari {titleLabel}
              </h3>
              <span className="text-xs text-muted-foreground">
                {bookings.length} Reservasi • {blockedTimes.length} Blokir
              </span>
            </div>

            {bookings.length === 0 && blockedTimes.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-xs italic">
                Tidak ada reservasi atau blokir waktu pada tanggal ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {blockedTimes.map(renderBlockedItem)}
                {bookings.map(renderBookingItem)}
              </div>
            )}
          </div>
        )}

        {/* WEEK VIEW */}
        {viewMode === "week" && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, idx) => {
              // Hitung tanggal kolom (Senin s/d Minggu)
              const d = new Date(currentDate);
              const day = d.getDay();
              const diff = d.getDate() - day + (day === 0 ? -6 : 1) + idx;
              const colDate = new Date(d.setDate(diff));
              const colDateStr = toYYYYMMDD(colDate);
              const isToday = colDateStr === toYYYYMMDD(new Date());

              // Filter bookings & blocked for this day
              const dayBookings = bookings.filter((b) => {
                const bDateStr = toYYYYMMDD(new Date(b.startAt));
                return bDateStr === colDateStr;
              });

              const dayBlocked = blockedTimes.filter((bt) => {
                const btDateStr = toYYYYMMDD(new Date(bt.startAt));
                return btDateStr === colDateStr;
              });

              return (
                <div
                  key={idx}
                  className={`border rounded-lg p-2.5 space-y-2 min-h-[380px] flex flex-col ${
                    isToday ? "bg-accent/5 border-accent/40" : "bg-muted/10"
                  }`}
                >
                  <div className="border-b pb-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {formatIndonesianDate(colDate, { weekday: "short" })}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                        isToday
                          ? "bg-accent text-white"
                          : "text-muted-foreground"
                      }`}
                    >
                      {colDate.getDate()}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {dayBlocked.map(renderBlockedItem)}
                    {dayBookings.map(renderBookingItem)}

                    {dayBookings.length === 0 && dayBlocked.length === 0 && (
                      <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground/60 italic py-8">
                        Kosong
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MONTH VIEW */}
        {viewMode === "month" && (
          <div className="space-y-3 overflow-x-auto min-w-0">
            <div className="min-w-[280px] space-y-3">
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-muted-foreground border-b pb-2">
                <span>Sen</span>
                <span>Sel</span>
                <span>Rab</span>
                <span>Kam</span>
                <span>Jum</span>
                <span>Sab</span>
                <span>Min</span>
              </div>

              <div className="grid grid-cols-7 gap-1">
              {(() => {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const firstDayMonth = new Date(year, month, 1);
                const lastDayMonth = new Date(year, month + 1, 0);

                // Offset Senin: JS getDay 0=Minggu, 1=Senin
                const startDay = firstDayMonth.getDay();
                const prefixDays = startDay === 0 ? 6 : startDay - 1;

                const days = [];
                // Kosongkan hari sebelumnya
                for (let i = 0; i < prefixDays; i++) {
                  days.push(<div key={`pre-${i}`} className="min-h-[85px] bg-muted/10 rounded-md border border-dashed opacity-40" />);
                }

                // Hari-hari bulan ini
                for (let d = 1; d <= lastDayMonth.getDate(); d++) {
                  const dayObj = new Date(year, month, d);
                  const dayStr = toYYYYMMDD(dayObj);
                  const isToday = dayStr === toYYYYMMDD(new Date());

                  const dayBookings = bookings.filter((b) => {
                    return toYYYYMMDD(new Date(b.startAt)) === dayStr;
                  });
                  const dayBlocked = blockedTimes.filter((bt) => {
                    return toYYYYMMDD(new Date(bt.startAt)) === dayStr;
                  });

                  days.push(
                    <div
                      key={dayStr}
                      className={`min-h-[85px] p-1.5 border rounded-md flex flex-col justify-between ${
                        isToday ? "bg-accent/10 border-accent/60" : "bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`font-bold ${isToday ? "text-accent" : "text-foreground"}`}>
                          {d}
                        </span>
                        {dayBookings.length > 0 && (
                          <span className="text-[10px] px-1 rounded bg-primary/10 text-primary font-semibold">
                            {dayBookings.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mt-1">
                        {dayBlocked.length > 0 && (
                          <div className="text-[10px] text-amber-700 bg-amber-100 dark:bg-amber-950 px-1 py-0.5 rounded truncate">
                            {dayBlocked.length} Blokir
                          </div>
                        )}
                        {dayBookings.slice(0, 2).map((b) => (
                          <Link
                            key={b.id}
                            href={`/dashboard/bookings/${b.id}`}
                            className="block text-[10px] truncate text-primary font-medium hover:underline bg-muted/50 px-1 py-0.5 rounded"
                            title={`${b.pet?.name} (${b.service?.name})`}
                          >
                            {b.pet?.name}
                          </Link>
                        ))}
                        {dayBookings.length > 2 && (
                          <span className="text-[9px] text-muted-foreground block text-right">
                            +{dayBookings.length - 2} lagi
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                return days;
              })()}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
