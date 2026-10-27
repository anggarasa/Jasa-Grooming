import { describe, it, expect } from "vitest";
import {
  timeToMinutes,
  minutesToTime,
  jakartaDateToUtc,
  getDayOfWeekJakarta,
  isIntervalOverlapping,
  generateDateSlots,
} from "@backend/modules/availability/slot-generator";

describe("Availability Slot Generator — Interval & Time Math", () => {
  it("mengonversi format jam HH:mm ke menit dan sebaliknya dengan tepat", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("09:00")).toBe(540);
    expect(timeToMinutes("12:30")).toBe(750);
    expect(timeToMinutes("18:00")).toBe(1080);
    expect(timeToMinutes("23:59")).toBe(1439);

    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(540)).toBe("09:00");
    expect(minutesToTime(750)).toBe("12:30");
    expect(minutesToTime(1080)).toBe("18:00");
  });

  it("mengonversi tanggal dan jam Asia/Jakarta (UTC+7) ke objek UTC Date yang tepat", () => {
    // 2026-10-24 09:00 WIB harus sama dengan 2026-10-24 02:00:00 UTC
    const utcDate = jakartaDateToUtc("2026-10-24", "09:00");
    expect(utcDate.toISOString()).toBe("2026-10-24T02:00:00.000Z");

    // 2026-10-24 18:00 WIB harus sama dengan 2026-10-24 11:00:00 UTC
    const closeUtc = jakartaDateToUtc("2026-10-24", "18:00");
    expect(closeUtc.toISOString()).toBe("2026-10-24T11:00:00.000Z");
  });

  it("menentukan hari dalam seminggu di Asia/Jakarta secara independen dari zona waktu mesin", () => {
    // 2026-10-25 adalah hari Minggu (0)
    expect(getDayOfWeekJakarta("2026-10-25")).toBe(0);
    // 2026-10-26 adalah hari Senin (1)
    expect(getDayOfWeekJakarta("2026-10-26")).toBe(1);
    // 2026-10-31 adalah hari Sabtu (6)
    expect(getDayOfWeekJakarta("2026-10-31")).toBe(6);
  });

  it("menerapkan aturan matematika interval half-open [start, end) dengan akurat", () => {
    // Interval [10:00, 11:00) dan [11:00, 12:00) TIDAK bertabrakan (tepat bersebelahan)
    expect(isIntervalOverlapping(600, 660, 660, 720)).toBe(false);

    // Interval [10:00, 11:15) dan [11:00, 12:00) BERTABRAKAN pada 11:00-11:15
    expect(isIntervalOverlapping(600, 675, 660, 720)).toBe(true);

    // Interval A di dalam interval B
    expect(isIntervalOverlapping(630, 650, 600, 700)).toBe(true);

    // Interval A sepenuhnya sebelum interval B
    expect(isIntervalOverlapping(500, 550, 600, 700)).toBe(false);

    // Interval A sepenuhnya sesudah interval B
    expect(isIntervalOverlapping(750, 800, 600, 700)).toBe(false);
  });

  it("menghitung slot harian dengan buffer dan mendeteksi tabrakan jam istirahat", () => {
    // Jam buka: 09:00 - 18:00
    // Durasi layanan: 60 menit, Buffer: 15 menit -> total okupansi = 75 menit
    // Istirahat: 12:00 - 13:00
    const slots = generateDateSlots({
      dateStr: "2026-10-24",
      openTime: "09:00",
      closeTime: "18:00",
      slotIntervalMinutes: 30,
      durationMinutes: 60,
      effectiveBufferMinutes: 15,
      breaks: [{ startTime: "12:00", endTime: "13:00" }],
      existingBookings: [],
      now: new Date("2026-10-23T00:00:00.000Z"), // kemarin, agar semua slot tidak terhalang minAdvance
      minimumAdvanceMinutes: 60,
      maximumAdvanceDays: 30,
    });

    // 09:00 -> okupansi [09:00, 10:15) -> Tersedia
    const slot0900 = slots.find((s) => s.time === "09:00");
    expect(slot0900?.available).toBe(true);
    expect(slot0900?.startAt).toBe("2026-10-24T02:00:00.000Z");
    expect(slot0900?.endAt).toBe("2026-10-24T03:00:00.000Z");
    expect(slot0900?.occupancyEndAt).toBe("2026-10-24T03:15:00.000Z");

    // 10:30 -> okupansi [10:30, 11:45) -> selesai sebelum 12:00 -> Tersedia
    const slot1030 = slots.find((s) => s.time === "10:30");
    expect(slot1030?.available).toBe(true);

    // 11:00 -> okupansi [11:00, 12:15) -> buffer menabrak 12:00-13:00 -> Tidak Tersedia (BREAK)
    const slot1100 = slots.find((s) => s.time === "11:00");
    expect(slot1100?.available).toBe(false);
    expect(slot1100?.reason).toBe("BREAK");

    // 11:30 -> menabrak istirahat -> BREAK
    const slot1130 = slots.find((s) => s.time === "11:30");
    expect(slot1130?.available).toBe(false);
    expect(slot1130?.reason).toBe("BREAK");

    // 12:00 -> di tengah istirahat -> BREAK
    const slot1200 = slots.find((s) => s.time === "12:00");
    expect(slot1200?.available).toBe(false);
    expect(slot1200?.reason).toBe("BREAK");

    // 13:00 -> tepat setelah istirahat [13:00, 14:15) -> Tersedia
    const slot1300 = slots.find((s) => s.time === "13:00");
    expect(slot1300?.available).toBe(true);

    // 16:30 -> [16:30, 17:45) <= 18:00 -> Tersedia
    const slot1630 = slots.find((s) => s.time === "16:30");
    expect(slot1630?.available).toBe(true);

    // 17:00 -> [17:00, 18:15) > 18:00 -> Tidak Tersedia (OUTSIDE_HOURS)
    const slot1700 = slots.find((s) => s.time === "17:00");
    expect(slot1700?.available).toBe(false);
    expect(slot1700?.reason).toBe("OUTSIDE_HOURS");
  });

  it("menandai slot tidak tersedia jika bertabrakan dengan reservasi aktif yang ada", () => {
    // Ada booking di 10:00 - 11:00 dengan buffer sampai 11:15
    const startAt = jakartaDateToUtc("2026-10-24", "10:00");
    const occupancyEndAt = jakartaDateToUtc("2026-10-24", "11:15");

    const slots = generateDateSlots({
      dateStr: "2026-10-24",
      openTime: "09:00",
      closeTime: "18:00",
      slotIntervalMinutes: 30,
      durationMinutes: 60,
      effectiveBufferMinutes: 15,
      breaks: [],
      existingBookings: [{ startAt, occupancyEndAt }],
      now: new Date("2026-10-23T00:00:00.000Z"),
      minimumAdvanceMinutes: 60,
      maximumAdvanceDays: 30,
    });

    // 09:30 -> [09:30, 10:45) menabrak [10:00, 11:15) -> BOOKED
    const slot0930 = slots.find((s) => s.time === "09:30");
    expect(slot0930?.available).toBe(false);
    expect(slot0930?.reason).toBe("BOOKED");

    // 10:00 -> sama -> BOOKED
    const slot1000 = slots.find((s) => s.time === "10:00");
    expect(slot1000?.available).toBe(false);
    expect(slot1000?.reason).toBe("BOOKED");

    // 10:30 -> BOOKED
    const slot1030 = slots.find((s) => s.time === "10:30");
    expect(slot1030?.available).toBe(false);
    expect(slot1030?.reason).toBe("BOOKED");

    // 11:00 -> [11:00, 12:15) menabrak [10:00, 11:15) pada 11:00-11:15 -> BOOKED
    const slot1100 = slots.find((s) => s.time === "11:00");
    expect(slot1100?.available).toBe(false);
    expect(slot1100?.reason).toBe("BOOKED");

    // 11:30 -> [11:30, 12:45) tidak menabrak [10:00, 11:15) -> Tersedia
    const slot1130 = slots.find((s) => s.time === "11:30");
    expect(slot1130?.available).toBe(true);
  });

  it("menolak slot jika kurang dari batas minimum advance notice (60 menit)", () => {
    // Sekarang 2026-10-24 09:15 WIB (02:15 UTC)
    const now = jakartaDateToUtc("2026-10-24", "09:15");

    const slots = generateDateSlots({
      dateStr: "2026-10-24",
      openTime: "09:00",
      closeTime: "18:00",
      slotIntervalMinutes: 30,
      durationMinutes: 60,
      effectiveBufferMinutes: 15,
      breaks: [],
      existingBookings: [],
      now,
      minimumAdvanceMinutes: 60, // butuh minimal 60 menit setelah 09:15 -> 10:15
      maximumAdvanceDays: 30,
    });

    // 09:00 -> PAST
    const slot0900 = slots.find((s) => s.time === "09:00");
    expect(slot0900?.available).toBe(false);
    expect(slot0900?.reason).toBe("PAST");

    // 09:30 -> MIN_ADVANCE (hanya 15 menit dari sekarang)
    const slot0930 = slots.find((s) => s.time === "09:30");
    expect(slot0930?.available).toBe(false);
    expect(slot0930?.reason).toBe("MIN_ADVANCE");

    // 10:00 -> MIN_ADVANCE (hanya 45 menit dari sekarang)
    const slot1000 = slots.find((s) => s.time === "10:00");
    expect(slot1000?.available).toBe(false);
    expect(slot1000?.reason).toBe("MIN_ADVANCE");

    // 10:30 -> Tersedia (75 menit dari sekarang >= 60)
    const slot1030 = slots.find((s) => s.time === "10:30");
    expect(slot1030?.available).toBe(true);
  });
});
