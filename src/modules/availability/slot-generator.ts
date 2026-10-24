import { TimeSlot, SlotUnavailableReason } from "./types";

export interface OperatingBreak {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export interface ExistingBookingInterval {
  startAt: Date;
  occupancyEndAt: Date;
}

export interface ResourceBlockInterval {
  startAt: Date;
  endAt: Date;
  reason?: string;
}

export interface ExternalBusyInterval {
  startAt: Date;
  endAt: Date;
}

export interface SlotGeneratorOptions {
  dateStr: string; // "YYYY-MM-DD"
  openTime: string; // "HH:mm" e.g. "09:00"
  closeTime: string; // "HH:mm" e.g. "18:00"
  slotIntervalMinutes: number; // e.g. 30
  durationMinutes: number; // e.g. 60
  effectiveBufferMinutes: number; // e.g. 15
  breaks: OperatingBreak[];
  existingBookings: ExistingBookingInterval[];
  resourceBlocks?: ResourceBlockInterval[];
  externalBusyIntervals?: ExternalBusyInterval[];
  now?: Date;
  minimumAdvanceMinutes?: number; // default 60
  maximumAdvanceDays?: number; // default 30
  allowBufferPastClose?: boolean; // default false
}

/**
 * Converts "HH:mm" string to minutes from start of day (0 to 1439).
 */
export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || "0", 10);
  return hours * 60 + minutes;
}

/**
 * Converts minutes from start of day to "HH:mm" string.
 */
export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Creates a Date object for a given YYYY-MM-DD and HH:mm in Asia/Jakarta timezone (UTC+7).
 */
export function jakartaDateToUtc(dateStr: string, timeStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const [hourStr, minStr] = timeStr.split(":");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const min = parseInt(minStr || "0", 10);

  // UTC+7 offset is 7 * 60 minutes = 420 minutes
  const utcMillis = Date.UTC(year, month, day, hour - 7, min, 0, 0);
  return new Date(utcMillis);
}

/**
 * Returns day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) for YYYY-MM-DD in Asia/Jakarta timezone.
 */
export function getDayOfWeekJakarta(dateStr: string): number {
  // Noon in Jakarta is 05:00 UTC on the same calendar day
  const noonJakarta = jakartaDateToUtc(dateStr, "12:00");
  return noonJakarta.getUTCDay();
}

/**
 * Half-open interval overlap check: [startA, endA) and [startB, endB)
 * Two intervals overlap if and only if startA < endB and endA > startB.
 */
export function isIntervalOverlapping(
  startA: Date | number,
  endA: Date | number,
  startB: Date | number,
  endB: Date | number
): boolean {
  const sA = typeof startA === "number" ? startA : startA.getTime();
  const eA = typeof endA === "number" ? endA : endA.getTime();
  const sB = typeof startB === "number" ? startB : startB.getTime();
  const eB = typeof endB === "number" ? endB : endB.getTime();

  return sA < eB && eA > sB;
}

/**
 * Generates all candidate slots for a given date in Asia/Jakarta timezone,
 * evaluating availability against operating hours, breaks, existing bookings,
 * and advance booking constraints.
 */
export function generateDateSlots(options: SlotGeneratorOptions): TimeSlot[] {
  const {
    dateStr,
    openTime,
    closeTime,
    slotIntervalMinutes,
    durationMinutes,
    effectiveBufferMinutes,
    breaks,
    existingBookings,
    resourceBlocks,
    externalBusyIntervals,
    now = new Date(),
    minimumAdvanceMinutes = 60,
    maximumAdvanceDays = 30,
    allowBufferPastClose = false,
  } = options;

  const slots: TimeSlot[] = [];
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);

  if (openMinutes >= closeMinutes || slotIntervalMinutes <= 0 || durationMinutes <= 0) {
    return slots;
  }

  // Calculate start of today in Jakarta for maxAdvanceDays check
  const nowJakartaNoon = new Date(now.getTime() + 7 * 3600 * 1000);
  const todayJakartaStr = nowJakartaNoon.toISOString().slice(0, 10);
  const todayJakartaStart = jakartaDateToUtc(todayJakartaStr, "00:00");
  const maxAllowedDate = new Date(
    todayJakartaStart.getTime() + maximumAdvanceDays * 24 * 3600 * 1000 + 24 * 3600 * 1000 - 1
  );

  const minAdvanceTimestamp = now.getTime() + minimumAdvanceMinutes * 60 * 1000;

  // Convert break intervals to minutes
  const breakIntervals = breaks.map((b) => ({
    startMinutes: timeToMinutes(b.startTime),
    endMinutes: timeToMinutes(b.endTime),
  }));

  // Generate candidate start times
  for (
    let startMin = openMinutes;
    startMin + durationMinutes <= closeMinutes || startMin < closeMinutes;
    startMin += slotIntervalMinutes
  ) {
    // If the service itself starts at or after closing, stop generating
    if (startMin >= closeMinutes) break;

    const timeStr = minutesToTime(startMin);
    const serviceEndMin = startMin + durationMinutes;
    const occupancyEndMin = serviceEndMin + effectiveBufferMinutes;

    const startAt = jakartaDateToUtc(dateStr, timeStr);
    const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);
    const occupancyEndAt = new Date(
      startAt.getTime() + (durationMinutes + effectiveBufferMinutes) * 60 * 1000
    );

    let available = true;
    let reason: SlotUnavailableReason | undefined;

    // 1. Operating Hours Check
    if (serviceEndMin > closeMinutes) {
      available = false;
      reason = "OUTSIDE_HOURS";
    } else if (!allowBufferPastClose && occupancyEndMin > closeMinutes) {
      available = false;
      reason = "OUTSIDE_HOURS";
    }

    // 2. Maximum Advance Window Check
    if (available && startAt.getTime() > maxAllowedDate.getTime()) {
      available = false;
      reason = "MAX_ADVANCE";
    }

    // 3. Past or Minimum Advance Notice Check
    if (available) {
      if (startAt.getTime() <= now.getTime()) {
        available = false;
        reason = "PAST";
      } else if (startAt.getTime() < minAdvanceTimestamp) {
        available = false;
        reason = "MIN_ADVANCE";
      }
    }

    // 4. Operating Breaks Overlap Check
    if (available) {
      for (const brk of breakIntervals) {
        if (
          isIntervalOverlapping(
            startMin,
            occupancyEndMin,
            brk.startMinutes,
            brk.endMinutes
          )
        ) {
          available = false;
          reason = "BREAK";
          break;
        }
      }
    }

    // 5. Existing Bookings Overlap Check [startAt, occupancyEndAt)
    if (available) {
      for (const booking of existingBookings) {
        if (
          isIntervalOverlapping(
            startAt,
            occupancyEndAt,
            booking.startAt,
            booking.occupancyEndAt
          )
        ) {
          available = false;
          reason = "BOOKED";
          break;
        }
      }
    }

    // 6. Resource Blocks Overlap Check [startAt, occupancyEndAt) vs [block.startAt, block.endAt)
    if (available && resourceBlocks && resourceBlocks.length > 0) {
      for (const block of resourceBlocks) {
        if (
          isIntervalOverlapping(
            startAt,
            occupancyEndAt,
            block.startAt,
            block.endAt
          )
        ) {
          available = false;
          reason = "BLOCKED";
          break;
        }
      }
    }

    // 7. Google Calendar External Busy Intervals Overlap Check [startAt, occupancyEndAt)
    if (available && externalBusyIntervals && externalBusyIntervals.length > 0) {
      for (const busy of externalBusyIntervals) {
        if (
          isIntervalOverlapping(
            startAt,
            occupancyEndAt,
            busy.startAt,
            busy.endAt
          )
        ) {
          available = false;
          reason = "EXTERNAL_BUSY";
          break;
        }
      }
    }

    slots.push({
      time: timeStr,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      occupancyEndAt: occupancyEndAt.toISOString(),
      available,
      ...(reason ? { reason } : {}),
    });
  }

  return slots;
}
