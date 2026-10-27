import * as React from "react";
import { Clock, Coffee } from "lucide-react";
import { PublicOperatingHourDay } from "@backend/modules/public/public-hours.service";

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
    <div className="overflow-hidden rounded-card-lg bg-white ring-1 ring-inset ring-arch-line">
      {showStatusBadge && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-canvas-tint px-5 py-4">
          <div className="flex items-center gap-2 text-base font-semibold text-ink">
            <Clock className="size-4 text-forest" aria-hidden="true" />
            <span>Jadwal Operasional Mingguan</span>
          </div>

          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-ink">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${
                isOpenNow ? "bg-status-dot" : "bg-ink-muted"
              }`}
            />
            {isOpenNow ? "Buka Sekarang" : statusText || "Tutup"}
          </p>
        </div>
      )}

      <div className="divide-y divide-arch-line">
        {schedule.map((day) => {
          const isToday = todayDayOfWeek !== undefined && day.dayOfWeek === todayDayOfWeek;

          return (
            <div
              key={day.dayOfWeek}
              className={`flex flex-col justify-between gap-1 px-5 py-3.5 sm:flex-row sm:items-center ${
                isToday ? "bg-pill-status/50" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="min-w-[72px] text-[15px] font-semibold text-ink">
                  {day.dayName}
                </span>

                {isToday && (
                  <span className="inline-flex items-center rounded-full bg-forest px-2.5 py-0.5 text-xs font-semibold text-white">
                    Hari Ini
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[15px]">
                {day.isOpen ? (
                  <>
                    <span className="font-semibold text-forest-ink">
                      {day.openTime} – {day.closeTime} WIB
                    </span>

                    {Boolean(day.breaks && day.breaks.length > 0) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-0.5 text-sm text-ink-body">
                        <Coffee className="size-3.5" aria-hidden="true" />
                        Jeda: {day.breaks?.map((b) => `${b.startTime}-${b.endTime}`).join(", ")}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="rounded-full bg-chip px-3 py-0.5 text-sm text-ink-muted">
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
