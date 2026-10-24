import { describe, it, expect } from "vitest";
import { generateDateSlots, jakartaDateToUtc } from "@/modules/availability/slot-generator";

describe("Availability Slot Generator — External Busy Intervals", () => {
  const baseOptions = {
    dateStr: "2026-10-24",
    openTime: "09:00",
    closeTime: "18:00",
    slotIntervalMinutes: 60,
    durationMinutes: 60,
    effectiveBufferMinutes: 0,
    breaks: [],
    existingBookings: [],
    resourceBlocks: [],
    now: jakartaDateToUtc("2026-10-20", "00:00"),
  };

  it("memblokir slot yang bertabrakan dengan jadwal sibuk kalender Google eksternal", () => {
    // Event eksternal Google: 11:00 - 13:00 WIB
    const externalBusyStart = jakartaDateToUtc("2026-10-24", "11:00");
    const externalBusyEnd = jakartaDateToUtc("2026-10-24", "13:00");

    const slots = generateDateSlots({
      ...baseOptions,
      externalBusyIntervals: [
        {
          startAt: externalBusyStart,
          endAt: externalBusyEnd,
        },
      ],
    });

    const slot09 = slots.find((s) => s.time === "09:00");
    const slot10 = slots.find((s) => s.time === "10:00");
    const slot11 = slots.find((s) => s.time === "11:00");
    const slot12 = slots.find((s) => s.time === "12:00");
    const slot13 = slots.find((s) => s.time === "13:00");

    expect(slot09?.available).toBe(true);
    expect(slot10?.available).toBe(true);
    // 11:00 - 12:00 dan 12:00 - 13:00 harus terblokir
    expect(slot11?.available).toBe(false);
    expect(slot11?.reason).toBe("EXTERNAL_BUSY");
    expect(slot12?.available).toBe(false);
    expect(slot12?.reason).toBe("EXTERNAL_BUSY");
    // 13:00 kembali luang
    expect(slot13?.available).toBe(true);
  });
});
