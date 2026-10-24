import { describe, it, expect } from "vitest";
import {
  generateDateSlots,
  jakartaDateToUtc,
} from "@/modules/availability/slot-generator";

describe("Availability Engine with ResourceBlock", () => {
  const baseDate = "2026-11-10";
  const fixedNow = jakartaDateToUtc("2026-11-09", "12:00");

  it("menandai slot sebagai BLOCKED jika bertabrakan dengan ResourceBlock", () => {
    const blockStart = jakartaDateToUtc(baseDate, "11:00");
    const blockEnd = jakartaDateToUtc(baseDate, "12:00");

    const slots = generateDateSlots({
      dateStr: baseDate,
      openTime: "09:00",
      closeTime: "17:00",
      slotIntervalMinutes: 30,
      durationMinutes: 60,
      effectiveBufferMinutes: 15,
      breaks: [],
      existingBookings: [],
      resourceBlocks: [
        {
          startAt: blockStart,
          endAt: blockEnd,
          reason: "Pemeliharaan meja grooming darurat",
        },
      ],
      now: fixedNow,
      minimumAdvanceMinutes: 0,
    });

    const slot0900 = slots.find((s) => s.time === "09:00");
    const slot1000 = slots.find((s) => s.time === "10:00");
    const slot1030 = slots.find((s) => s.time === "10:30");
    const slot1200 = slots.find((s) => s.time === "12:00");

    expect(slot0900?.available).toBe(true);

    // Slot 10:00 (10:00 - 11:15 occupancy) bertabrakan dengan block [11:00, 12:00)
    expect(slot1000?.available).toBe(false);
    expect(slot1000?.reason).toBe("BLOCKED");

    // Slot 10:30 (10:30 - 11:45 occupancy) bertabrakan dengan block [11:00, 12:00)
    expect(slot1030?.available).toBe(false);
    expect(slot1030?.reason).toBe("BLOCKED");

    // Slot 12:00 (12:00 - 13:15 occupancy) tepat di batas akhir block
    expect(slot1200?.available).toBe(true);
  });

  it("mengabaikan ResourceBlock yang tidak memiliki bentrokan rentang waktu", () => {
    const blockStart = jakartaDateToUtc(baseDate, "14:00");
    const blockEnd = jakartaDateToUtc(baseDate, "15:00");

    const slots = generateDateSlots({
      dateStr: baseDate,
      openTime: "09:00",
      closeTime: "17:00",
      slotIntervalMinutes: 30,
      durationMinutes: 60,
      effectiveBufferMinutes: 15,
      breaks: [],
      existingBookings: [],
      resourceBlocks: [
        {
          startAt: blockStart,
          endAt: blockEnd,
          reason: "Briefing staf",
        },
      ],
      now: fixedNow,
      minimumAdvanceMinutes: 0,
    });

    const slot0900 = slots.find((s) => s.time === "09:00");
    expect(slot0900?.available).toBe(true);

    const slot1400 = slots.find((s) => s.time === "14:00");
    expect(slot1400?.available).toBe(false);
    expect(slot1400?.reason).toBe("BLOCKED");
  });
});
