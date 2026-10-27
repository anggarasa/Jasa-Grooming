import { describe, it, expect } from "vitest";
import {
  operatingDaySchema,
  updateOperatingHoursSchema,
} from "@backend/modules/business/schemas";

describe("Validasi Jam Operasional & Istirahat (operatingDaySchema)", () => {
  it("menerima konfigurasi hari kerja normal dengan istirahat valid", () => {
    const validDay = {
      dayOfWeek: 1, // Senin
      isOpen: true,
      openTime: "09:00",
      closeTime: "18:00",
      breaks: [
        { startTime: "12:00", endTime: "13:00" },
        { startTime: "15:00", endTime: "15:30" },
      ],
    };

    const result = operatingDaySchema.safeParse(validDay);
    expect(result.success).toBe(true);
  });

  it("menerima hari libur (isOpen = false) meskipun tanpa jam buka atau break", () => {
    const closedDay = {
      dayOfWeek: 0, // Minggu libur
      isOpen: false,
      openTime: "09:00",
      closeTime: "18:00",
      breaks: [],
    };

    const result = operatingDaySchema.safeParse(closedDay);
    expect(result.success).toBe(true);
  });

  it("menolak jika jam buka sama dengan atau setelah jam tutup", () => {
    const invalidDay = {
      dayOfWeek: 1,
      isOpen: true,
      openTime: "18:00",
      closeTime: "09:00",
      breaks: [],
    };

    const result = operatingDaySchema.safeParse(invalidDay);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.message.includes("harus lebih awal dari jam tutup"))).toBe(true);
    }
  });

  it("menolak jika waktu mulai istirahat sama dengan atau setelah waktu selesai istirahat", () => {
    const invalidBreak = {
      dayOfWeek: 1,
      isOpen: true,
      openTime: "09:00",
      closeTime: "18:00",
      breaks: [{ startTime: "13:00", endTime: "12:00" }],
    };

    const result = operatingDaySchema.safeParse(invalidBreak);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes("lebih awal dari waktu selesai"))
      ).toBe(true);
    }
  });

  it("menolak jika jadwal istirahat berada di luar jam operasional", () => {
    // Istirahat sebelum jam buka
    const breakBeforeOpen = {
      dayOfWeek: 2,
      isOpen: true,
      openTime: "09:00",
      closeTime: "17:00",
      breaks: [{ startTime: "08:00", endTime: "08:30" }],
    };

    const result1 = operatingDaySchema.safeParse(breakBeforeOpen);
    expect(result1.success).toBe(false);
    if (!result1.success) {
      expect(
        result1.error.issues.some((i) => i.message.includes("tidak boleh sebelum jam buka"))
      ).toBe(true);
    }

    // Istirahat setelah jam tutup
    const breakAfterClose = {
      dayOfWeek: 2,
      isOpen: true,
      openTime: "09:00",
      closeTime: "17:00",
      breaks: [{ startTime: "17:30", endTime: "18:00" }],
    };

    const result2 = operatingDaySchema.safeParse(breakAfterClose);
    expect(result2.success).toBe(false);
    if (!result2.success) {
      expect(
        result2.error.issues.some((i) => i.message.includes("tidak boleh melebihi jam tutup"))
      ).toBe(true);
    }
  });

  it("menolak jika terdapat jadwal istirahat yang saling tumpang tindih (overlap)", () => {
    const overlappingBreaks = {
      dayOfWeek: 3,
      isOpen: true,
      openTime: "09:00",
      closeTime: "18:00",
      breaks: [
        { startTime: "12:00", endTime: "13:00" },
        { startTime: "12:30", endTime: "13:30" }, // Overlap dengan 12:00-13:00
      ],
    };

    const result = operatingDaySchema.safeParse(overlappingBreaks);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("bentrok"))).toBe(true);
    }
  });

  it("menolak format waktu yang tidak sesuai HH:mm (misal 9:00 atau 25:00)", () => {
    const badFormat = {
      dayOfWeek: 4,
      isOpen: true,
      openTime: "9:00", // Kurang leading zero
      closeTime: "18:00",
      breaks: [],
    };

    const result = operatingDaySchema.safeParse(badFormat);
    expect(result.success).toBe(false);
  });
});

describe("Validasi Jam Operasional Kolektif (updateOperatingHoursSchema)", () => {
  it("menolak payload dengan hari (dayOfWeek) yang duplikat", () => {
    const duplicateDays = {
      hours: [
        {
          dayOfWeek: 1,
          isOpen: true,
          openTime: "09:00",
          closeTime: "18:00",
          breaks: [],
        },
        {
          dayOfWeek: 1, // Duplikat Senin
          isOpen: true,
          openTime: "10:00",
          closeTime: "17:00",
          breaks: [],
        },
      ],
    };

    const result = updateOperatingHoursSchema.safeParse(duplicateDays);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes("tidak boleh mengandung hari yang duplikat"))
      ).toBe(true);
    }
  });

  it("menerima payload dengan hari-hari yang unik", () => {
    const validHours = {
      hours: [
        {
          dayOfWeek: 1,
          isOpen: true,
          openTime: "09:00",
          closeTime: "18:00",
          breaks: [],
        },
        {
          dayOfWeek: 2,
          isOpen: true,
          openTime: "09:00",
          closeTime: "18:00",
          breaks: [],
        },
      ],
    };

    const result = updateOperatingHoursSchema.safeParse(validHours);
    expect(result.success).toBe(true);
  });
});
