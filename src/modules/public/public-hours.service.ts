import { prisma } from "@/lib/prisma";

export interface PublicOperatingBreak {
  startTime: string;
  endTime: string;
}

export interface PublicOperatingHourDay {
  dayOfWeek: number; // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  dayName: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breaks: PublicOperatingBreak[];
  formattedHours: string;
}

export interface PublicOperatingStatus {
  isOpenNow: boolean;
  statusText: string;
  todayHours: PublicOperatingHourDay | null;
  schedule: PublicOperatingHourDay[];
  timezone: string;
}

export const INDONESIAN_DAY_NAMES: Record<number, string> = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
};

/**
 * Mengambil waktu saat ini di zona Asia/Jakarta
 */
export function getJakartaCurrentTime(baseDate = new Date()): {
  dayOfWeek: number;
  timeString: string;
  hours: number;
  minutes: number;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    hour12: false,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = formatter.formatToParts(baseDate);
  const weekdayPart = parts.find((p) => p.type === "weekday")?.value || "";
  const hourPart = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const minutePart = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const dayOfWeek = dayMap[weekdayPart] ?? baseDate.getDay();
  // Handle edge case where 24:00 is returned by some environments for midnight
  const normalizedHour = hourPart === 24 ? 0 : hourPart;
  const timeString = `${String(normalizedHour).padStart(2, "0")}:${String(minutePart).padStart(2, "0")}`;

  return {
    dayOfWeek,
    timeString,
    hours: normalizedHour,
    minutes: minutePart,
  };
}

/**
 * Mengevaluasi status operasional (Buka / Istirahat / Tutup) berdasarkan jadwal hari ini
 */
export function evaluateOperatingStatus(
  schedule: PublicOperatingHourDay[],
  currentTime = getJakartaCurrentTime()
): {
  isOpenNow: boolean;
  statusText: string;
  todayHours: PublicOperatingHourDay | null;
} {
  const today = schedule.find((d) => d.dayOfWeek === currentTime.dayOfWeek) || null;

  if (!today || !today.isOpen) {
    return {
      isOpenNow: false,
      statusText: "Tutup Hari Ini",
      todayHours: today,
    };
  }

  const current = currentTime.timeString;

  if (current < today.openTime || current >= today.closeTime) {
    return {
      isOpenNow: false,
      statusText: "Tutup Sekarang",
      todayHours: today,
    };
  }

  // Cek jika sedang dalam waktu jeda (break/istirahat)
  for (const brk of today.breaks) {
    if (current >= brk.startTime && current < brk.endTime) {
      return {
        isOpenNow: false,
        statusText: "Sedang Istirahat",
        todayHours: today,
      };
    }
  }

  return {
    isOpenNow: true,
    statusText: "Buka Sekarang",
    todayHours: today,
  };
}

/**
 * Mengambil jadwal jam operasional mingguan 7 hari dan status saat ini
 */
export async function getPublicOperatingHours(): Promise<PublicOperatingStatus> {
  const business = await prisma.business.findFirst({
    where: { isActive: true },
    select: {
      id: true,
      timezone: true,
      operatingHours: {
        include: {
          breaks: {
            orderBy: { startTime: "asc" },
          },
        },
        orderBy: { dayOfWeek: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const timezone = business?.timezone || "Asia/Jakarta";
  const rawHours = business?.operatingHours || [];

  // Bangun jadwal 7 hari lengkap (0..6)
  const schedule: PublicOperatingHourDay[] = Array.from({ length: 7 }, (_, i) => {
    const found = rawHours.find((h) => h.dayOfWeek === i);
    const dayName = INDONESIAN_DAY_NAMES[i] || `Hari ${i}`;

    if (!found) {
      return {
        dayOfWeek: i,
        dayName,
        isOpen: false,
        openTime: "09:00",
        closeTime: "18:00",
        breaks: [],
        formattedHours: "Tutup",
      };
    }

    const breaks: PublicOperatingBreak[] = found.breaks.map((b) => ({
      startTime: b.startTime,
      endTime: b.endTime,
    }));

    const formattedHours = found.isOpen
      ? `${found.openTime} - ${found.closeTime}`
      : "Tutup";

    return {
      dayOfWeek: found.dayOfWeek,
      dayName,
      isOpen: found.isOpen,
      openTime: found.openTime,
      closeTime: found.closeTime,
      breaks,
      formattedHours,
    };
  });

  const { isOpenNow, statusText, todayHours } = evaluateOperatingStatus(
    schedule,
    getJakartaCurrentTime()
  );

  return {
    isOpenNow,
    statusText,
    todayHours,
    schedule,
    timezone,
  };
}
