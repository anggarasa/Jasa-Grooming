import { describe, it, expect } from "vitest";
import {
  addDays,
  buildDailySeries,
  compareToYesterday,
  isActiveStatus,
  jakartaDateKey,
  percentOf,
  serviceBreakdown,
  sourceSplit,
  type StatBooking,
} from "@backend/modules/bookings/dashboard-stats";

const TODAY = "2026-10-26"; // Senin

const b = (
  startAt: string,
  status: string,
  price = 100_000,
  extra: Partial<StatBooking> = {}
): StatBooking => ({
  startAt,
  status,
  source: "PUBLIC_GUEST",
  price,
  serviceName: "Basic Cat Grooming",
  ...extra,
});

describe("tanggal WIB", () => {
  it("jakartaDateKey memakai WIB (UTC+7), bukan UTC", () => {
    // 17.30 UTC tgl 26 = 00.30 WIB tgl 27
    expect(jakartaDateKey("2026-10-26T17:30:00.000Z")).toBe("2026-10-27");
    expect(jakartaDateKey("2026-10-26T16:59:00.000Z")).toBe("2026-10-26");
    expect(jakartaDateKey("tidak-valid")).toBe("");
  });

  it("addDays aman melintasi bulan dan tahun", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("buildDailySeries", () => {
  it("selalu menghasilkan jendela utuh (6 hari lalu s/d 7 hari ke depan = 14 titik) walau tanpa data", () => {
    const series = buildDailySeries([], TODAY);
    expect(series).toHaveLength(14);
    expect(series[0].date).toBe("2026-10-20");
    expect(series[13].date).toBe("2026-11-02");
    expect(series.filter((p) => p.isToday)).toHaveLength(1);
    expect(series.find((p) => p.isToday)?.date).toBe(TODAY);
    expect(series.every((p) => p.active === 0 && p.revenue === 0)).toBe(true);
  });

  it("memberi label hari yang benar", () => {
    const today = buildDailySeries([], TODAY).find((p) => p.isToday)!;
    expect(today.weekday).toBe("Sen");
    expect(today.day).toBe("26");
  });

  it("hanya menghitung reservasi aktif; Dibatalkan & Tidak Hadir tidak masuk hitungan/pendapatan", () => {
    const series = buildDailySeries(
      [
        b("2026-10-26T03:00:00.000Z", "CONFIRMED", 100_000),
        b("2026-10-26T04:00:00.000Z", "COMPLETED", 200_000),
        b("2026-10-26T05:00:00.000Z", "CANCELLED", 999_000),
        b("2026-10-26T06:00:00.000Z", "NO_SHOW", 888_000),
      ],
      TODAY
    );
    const today = series.find((p) => p.isToday)!;
    expect(today.total).toBe(4); // semua status dihitung di "total"
    expect(today.active).toBe(2);
    expect(today.revenue).toBe(300_000);
    expect(today.completed).toBe(1);
    expect(today.completedRevenue).toBe(200_000);
  });

  it("'upcoming' hanya Menunggu/Dikonfirmasi dari hari ini ke depan", () => {
    const series = buildDailySeries(
      [
        b("2026-10-23T03:00:00.000Z", "CONFIRMED"), // sudah lewat -> tidak dihitung
        b("2026-10-26T03:00:00.000Z", "PENDING"),
        b("2026-10-28T03:00:00.000Z", "CONFIRMED"),
        b("2026-10-28T04:00:00.000Z", "COMPLETED"),
      ],
      TODAY
    );
    expect(series.reduce((s, p) => s + p.upcoming, 0)).toBe(2);
    expect(series.find((p) => p.date === "2026-10-23")?.upcoming).toBe(0);
  });

  it("reservasi di luar jendela diabaikan, dan hari ditentukan menurut WIB", () => {
    const series = buildDailySeries(
      [
        b("2026-09-01T03:00:00.000Z", "CONFIRMED"), // jauh di luar
        b("2026-10-26T17:30:00.000Z", "CONFIRMED"), // = 27 Okt 00.30 WIB
      ],
      TODAY
    );
    expect(series.reduce((s, p) => s + p.active, 0)).toBe(1);
    expect(series.find((p) => p.date === "2026-10-27")?.active).toBe(1);
    expect(series.find((p) => p.date === "2026-10-26")?.active).toBe(0);
  });

  it("harga tidak valid (NaN) dianggap 0, tidak merusak total", () => {
    const series = buildDailySeries([b("2026-10-26T03:00:00.000Z", "CONFIRMED", Number.NaN)], TODAY);
    expect(series.find((p) => p.isToday)?.revenue).toBe(0);
    expect(Number.isNaN(series.find((p) => p.isToday)?.revenue)).toBe(false);
  });
});

describe("serviceBreakdown", () => {
  const mk = (name: string, n: number, price = 50_000) =>
    Array.from({ length: n }, () => b("2026-10-26T03:00:00.000Z", "CONFIRMED", price, { serviceName: name }));

  it("mengurutkan dari terbanyak dan mengabaikan reservasi tidak aktif", () => {
    const out = serviceBreakdown([
      ...mk("A", 1),
      ...mk("B", 3),
      b("2026-10-26T03:00:00.000Z", "CANCELLED", 1, { serviceName: "A" }),
    ]);
    expect(out.map((s) => s.name)).toEqual(["B", "A"]);
    expect(out[0].count).toBe(3);
    expect(out[1].count).toBe(1);
  });

  it("menggabung sisa layanan menjadi 'Lainnya' tanpa menghilangkan hitungan", () => {
    const all = [...mk("A", 6), ...mk("B", 5), ...mk("C", 4), ...mk("D", 3), ...mk("E", 2), ...mk("F", 1)];
    const out = serviceBreakdown(all, 4);
    expect(out).toHaveLength(5);
    expect(out[4]).toMatchObject({ name: "Lainnya", count: 3 });
    expect(out.reduce((s, x) => s + x.count, 0)).toBe(all.length);
  });

  it("kosong -> daftar kosong", () => {
    expect(serviceBreakdown([])).toEqual([]);
  });
});

describe("sourceSplit", () => {
  it("memetakan sumber sah dan menganggap sisanya Online; tidak aktif tidak dihitung", () => {
    const out = sourceSplit([
      { source: "WALK_IN", status: "CONFIRMED" },
      { source: "ADMIN", status: "CONFIRMED" },
      { source: "PUBLIC_GUEST", status: "COMPLETED" },
      { source: "apa-saja", status: "PENDING" },
      { source: "WALK_IN", status: "CANCELLED" },
    ]);
    expect(out).toEqual({ online: 2, walkIn: 1, admin: 1, total: 4 });
  });
});

describe("pembanding & persen", () => {
  it("compareToYesterday: selisih, persen, dan kasus tanpa pembanding", () => {
    expect(compareToYesterday(6, 4)).toEqual({ delta: 2, pct: 50, same: false });
    expect(compareToYesterday(2, 4)).toEqual({ delta: -2, pct: -50, same: false });
    expect(compareToYesterday(3, 3)).toEqual({ delta: 0, pct: 0, same: true });
    expect(compareToYesterday(5, 0)).toEqual({ delta: 5, pct: null, same: false });
  });

  it("percentOf: membulatkan, membatasi 0–100, dan aman terhadap pembagi 0", () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(2, 3)).toBe(67);
    expect(percentOf(5, 0)).toBe(0);
    expect(percentOf(9, 3)).toBe(100);
    expect(percentOf(-1, 3)).toBe(0);
  });

  it("isActiveStatus", () => {
    expect(isActiveStatus("CONFIRMED")).toBe(true);
    expect(isActiveStatus("CANCELLED")).toBe(false);
    expect(isActiveStatus("NO_SHOW")).toBe(false);
  });
});
