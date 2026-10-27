import type { PublicOperatingHourDay } from "@backend/modules/public/public-hours.service";

export interface ScheduleSummaryRow {
  /** Contoh: "Senin – Sabtu" atau "Minggu". */
  label: string;
  /** Contoh: "09:00 – 18:00"; null bila libur. */
  hours: string | null;
  /** Contoh: "12:00 – 13:00"; null bila tidak ada istirahat. */
  breakText: string | null;
  closed: boolean;
}

/** Urutan tampil: Senin (1) sampai Sabtu (6), lalu Minggu (0). */
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function signature(day: PublicOperatingHourDay): string {
  if (!day.isOpen) return "closed";
  const breaks = day.breaks.map((b) => `${b.startTime}-${b.endTime}`).join(",");
  return `open|${day.openTime}|${day.closeTime}|${breaks}`;
}

/**
 * Meringkas jadwal mingguan: hari berurutan dengan jam yang sama digabung
 * ("Senin – Sabtu"). Hanya merangkum data yang diterima; tidak mengarang jam.
 */
export function summarizeSchedule(
  schedule: PublicOperatingHourDay[]
): ScheduleSummaryRow[] {
  const byDay = new Map(schedule.map((d) => [d.dayOfWeek, d]));
  const ordered = DISPLAY_ORDER.map((n) => byDay.get(n)).filter(
    (d): d is PublicOperatingHourDay => Boolean(d)
  );

  const groups: PublicOperatingHourDay[][] = [];
  for (const day of ordered) {
    const last = groups[groups.length - 1];
    if (last && signature(last[0]) === signature(day)) {
      last.push(day);
    } else {
      groups.push([day]);
    }
  }

  return groups.map((group) => {
    const first = group[0];
    const last = group[group.length - 1];
    const label =
      group.length === 1
        ? first.dayName
        : `${first.dayName} – ${last.dayName}`;

    if (!first.isOpen) {
      return { label, hours: null, breakText: null, closed: true };
    }

    return {
      label,
      hours: `${first.openTime} – ${first.closeTime}`,
      breakText:
        first.breaks.length > 0
          ? first.breaks.map((b) => `${b.startTime} – ${b.endTime}`).join(", ")
          : null,
      closed: false,
    };
  });
}
