import * as React from "react";
import { Clock, Coffee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PublicOperatingHourDay } from "@/modules/public/public-hours.service";

interface OperatingHoursTableProps {
  schedule: PublicOperatingHourDay[];
  todayDayOfWeek?: number;
  isOpenNow?: boolean;
  statusText?: string;
  showStatusBadge?: boolean;
}

export function OperatingHoursTable({
  schedule,
  todayDayOfWeek,
  isOpenNow,
  statusText,
  showStatusBadge = true,
}: OperatingHoursTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      {showStatusBadge && (
        <div className="flex items-center justify-between border-b border-border p-4 bg-muted/40">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-accent" aria-hidden="true" />
            <span>Jadwal Operasional Mingguan</span>
          </div>

          <div>
            {isOpenNow ? (
              <Badge variant="open" className="text-xs font-semibold px-2.5 py-0.5 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Buka Sekarang
              </Badge>
            ) : (
              <Badge variant="closed" className="text-xs font-semibold px-2.5 py-0.5 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mr-1.5" />
                {statusText || "Tutup"}
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="divide-y divide-border/60">
        {schedule.map((day) => {
          const isToday = todayDayOfWeek !== undefined && day.dayOfWeek === todayDayOfWeek;

          return (
            <div
              key={day.dayOfWeek}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:px-5 transition-colors ${
                isToday
                  ? "bg-secondary/40 font-medium"
                  : "hover:bg-muted/30"
              }`}
            >
              {/* Day Name & Hari Ini Badge */}
              <div className="flex items-center gap-2 mb-1 sm:mb-0">
                <span className="text-sm text-foreground font-semibold min-w-[70px]">
                  {day.dayName}
                </span>

                {isToday && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary tracking-wide uppercase">
                    Hari Ini
                  </span>
                )}
              </div>

              {/* Hours & Breaks */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {day.isOpen ? (
                  <>
                    <span className="font-semibold text-primary">
                      {day.openTime} – {day.closeTime} WIB
                    </span>

                    {Boolean(day.breaks && day.breaks.length > 0) && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-badge-break px-2 py-0.5 text-[11px] font-medium text-badge-break-foreground border border-badge-break-border">
                        <Coffee className="h-3 w-3" aria-hidden="true" />
                        Jeda: {day.breaks?.map((b) => `${b.startTime}-${b.endTime}`).join(", ")}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    Tutup / Libur
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
