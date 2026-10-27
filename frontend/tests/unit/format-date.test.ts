import { describe, it, expect } from "vitest";
import {
  formatIndonesianDate,
  formatIndonesianDateOnly,
  formatIndonesianTime,
  formatIndonesianTimeRange,
} from "@/lib/format-date";
import { getBookingSourceLabel } from "@/components/dashboard/bookings/BookingStatusBadge";

/**
 * Penjaga bug nyata di backoffice: `formatIndonesianDate` SELALU menyertakan jam
 * sebagai bawaan, jadi memanggilnya dengan `{ day, month, year }` saja tidak
 * menghilangkan jamnya, dan `{ hour, minute }` saja tidak menghilangkan tanggalnya.
 * Akibatnya tabel/detail menampilkan "29 Okt 2026, 15.00 - 29 Okt 2026, 16.45".
 *
 * 29 Okt 2026 08:00 UTC = 15.00 WIB (UTC+7, tanpa DST).
 */
const START = "2026-10-29T08:00:00.000Z";
const END_SAME_DAY = "2026-10-29T09:45:00.000Z";
const END_NEXT_DAY = "2026-10-30T09:45:00.000Z";
// 23.30 WIB tgl 29 → melewati tengah malam WIB di UTC yang masih tgl 29.
const LATE_START = "2026-10-29T16:30:00.000Z"; // 30 Okt 2026, 23.30 WIB
const LATE_END = "2026-10-29T18:00:00.000Z"; // 31 Okt 2026, 01.00 WIB

describe("format tanggal backoffice", () => {
  it("formatIndonesianDateOnly: hanya tanggal, tanpa jam", () => {
    const out = formatIndonesianDateOnly(START);
    expect(out).toContain("2026");
    expect(out).toMatch(/29/);
    expect(out).not.toMatch(/\d{1,2}[.:]\d{2}/);
  });

  it("formatIndonesianTime: hanya jam (WIB), tanpa tanggal", () => {
    const out = formatIndonesianTime(START);
    expect(out).toMatch(/^15[.:]00$/);
    expect(out).not.toContain("2026");
    expect(out).not.toMatch(/Okt/);
  });

  it("formatIndonesianDate bawaan tetap memuat tanggal dan jam (perilaku lama tidak berubah)", () => {
    const out = formatIndonesianDate(START);
    expect(out).toContain("2026");
    expect(out).toMatch(/15[.:]00/);
  });

  it("nilai kosong atau tidak valid menghasilkan '-'", () => {
    expect(formatIndonesianDateOnly(null)).toBe("-");
    expect(formatIndonesianTime(undefined)).toBe("-");
    expect(formatIndonesianDateOnly("bukan-tanggal")).toBe("-");
    expect(formatIndonesianTime("bukan-tanggal")).toBe("-");
  });
});

describe("formatIndonesianTimeRange", () => {
  it("hari yang sama: tanggal ditulis SEKALI", () => {
    const out = formatIndonesianTimeRange(START, END_SAME_DAY);
    expect(out.match(/2026/g)).toHaveLength(1);
    expect(out).toMatch(/15[.:]00/);
    expect(out).toMatch(/16[.:]45/);
  });

  it("beda hari: kedua tanggal ditulis lengkap", () => {
    const out = formatIndonesianTimeRange(START, END_NEXT_DAY);
    expect(out.match(/2026/g)).toHaveLength(2);
  });

  it("membandingkan hari menurut WIB, bukan UTC (melewati tengah malam WIB)", () => {
    // Di UTC keduanya sama-sama 29 Okt, tetapi di WIB berbeda hari (30 vs 31 Okt).
    const out = formatIndonesianTimeRange(LATE_START, LATE_END);
    expect(out.match(/2026/g)).toHaveLength(2);
  });

  it("tanpa waktu selesai: jatuh kembali ke satu tanggal+jam", () => {
    const out = formatIndonesianTimeRange(START, null);
    expect(out).toContain("2026");
    expect(out).not.toContain(" - ");
  });
});

describe("getBookingSourceLabel", () => {
  it("memetakan nilai database ke label manusiawi; nilai mentah tidak pernah bocor", () => {
    expect(getBookingSourceLabel("WALK_IN")).toBe("Walk-in");
    expect(getBookingSourceLabel("ADMIN")).toBe("Admin");
    expect(getBookingSourceLabel("PUBLIC_GUEST")).toBe("Online");
    expect(getBookingSourceLabel(null)).toBe("Online");
    expect(getBookingSourceLabel(undefined)).toBe("Online");
    expect(getBookingSourceLabel("PUBLIC_GUEST")).not.toMatch(/_/);
  });
});
