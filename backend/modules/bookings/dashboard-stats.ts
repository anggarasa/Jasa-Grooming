/**
 * Statistik halaman Ringkasan backoffice.
 *
 * Seluruh angka dihitung dari baris reservasi yang SUDAH ADA di database (lewat
 * `listAdminBookings` dan `getDashboardOverview`). Tidak ada angka karangan, target,
 * atau tren dari data yang tidak tersedia. Fungsi di sini murni (tanpa akses database)
 * sehingga mudah diuji.
 *
 * Konvensi: "hari" selalu menurut WIB (UTC+7, tanpa DST), sama seperti seluruh aplikasi.
 */

/** Bentuk minimal sebuah reservasi untuk statistik (sudah diserialisasi). */
export interface StatBooking {
  startAt: string | Date;
  status: string;
  source: string;
  /** Total harga dalam rupiah (angka, bukan Decimal). */
  price: number;
  serviceName: string;
}

export interface DayPoint {
  /** YYYY-MM-DD (WIB) */
  date: string;
  /** Tanggal dalam bulan, mis. "26". */
  day: string;
  /** Singkatan hari, mis. "Sen". */
  weekday: string;
  isToday: boolean;
  /** SEMUA reservasi pada hari itu, apa pun statusnya (sama dengan hitungan "Hari Ini" di kartu). */
  total: number;
  /** Reservasi aktif (bukan Dibatalkan / Tidak Hadir). */
  active: number;
  /** Estimasi pendapatan reservasi aktif (Rp). */
  revenue: number;
  /** Menunggu / Dikonfirmasi pada hari itu — hanya bermakna dari hari ini ke depan. */
  upcoming: number;
  completed: number;
  /** Pendapatan reservasi Selesai (Rp). */
  completedRevenue: number;
}

export interface ServiceSlice {
  name: string;
  count: number;
  revenue: number;
}

const INACTIVE = new Set(["CANCELLED", "NO_SHOW"]);
const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export const isActiveStatus = (status: string) => !INACTIVE.has(status);

/** Kunci tanggal WIB (YYYY-MM-DD) dari sebuah instan waktu. */
export function jakartaDateKey(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/** Menambah/mengurangi hari pada string YYYY-MM-DD (aritmetika UTC murni, aman dari DST). */
export function addDays(dateStr: string, amount: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}

/**
 * Deret harian dari `daysBack` hari sebelum hari ini sampai `daysForward` hari sesudahnya
 * (termasuk hari ini). Hari tanpa reservasi tetap muncul dengan nilai 0, sehingga
 * grafik selalu punya sumbu waktu yang utuh.
 */
export function buildDailySeries(
  bookings: StatBooking[],
  todayStr: string,
  daysBack = 6,
  daysForward = 7
): DayPoint[] {
  const points = new Map<string, DayPoint>();
  for (let offset = -daysBack; offset <= daysForward; offset += 1) {
    const date = addDays(todayStr, offset);
    const weekday = WEEKDAYS[new Date(`${date}T00:00:00.000Z`).getUTCDay()];
    points.set(date, {
      date,
      day: String(Number(date.slice(8, 10))),
      weekday,
      isToday: date === todayStr,
      total: 0,
      active: 0,
      revenue: 0,
      upcoming: 0,
      completed: 0,
      completedRevenue: 0,
    });
  }

  for (const booking of bookings) {
    const key = jakartaDateKey(booking.startAt);
    const point = points.get(key);
    if (!point) continue; // di luar jendela
    const price = Number.isFinite(booking.price) ? booking.price : 0;

    point.total += 1;
    if (isActiveStatus(booking.status)) {
      point.active += 1;
      point.revenue += price;
    }
    if (
      (booking.status === "PENDING" || booking.status === "CONFIRMED") &&
      key >= todayStr
    ) {
      point.upcoming += 1;
    }
    if (booking.status === "COMPLETED") {
      point.completed += 1;
      point.completedRevenue += price;
    }
  }

  return [...points.values()];
}

/**
 * Pecahan per layanan (hanya reservasi aktif), diurutkan dari yang terbanyak.
 * Layanan di luar `top` teratas digabung menjadi "Lainnya".
 */
export function serviceBreakdown(bookings: StatBooking[], top = 4): ServiceSlice[] {
  const map = new Map<string, ServiceSlice>();
  for (const booking of bookings) {
    if (!isActiveStatus(booking.status)) continue;
    const name = booking.serviceName || "Layanan";
    const slice = map.get(name) ?? { name, count: 0, revenue: 0 };
    slice.count += 1;
    slice.revenue += Number.isFinite(booking.price) ? booking.price : 0;
    map.set(name, slice);
  }
  const sorted = [...map.values()].sort(
    (a, b) => b.count - a.count || b.revenue - a.revenue || a.name.localeCompare(b.name)
  );
  if (sorted.length <= top) return sorted;
  const rest = sorted.slice(top).reduce(
    (acc, s) => ({ name: "Lainnya", count: acc.count + s.count, revenue: acc.revenue + s.revenue }),
    { name: "Lainnya", count: 0, revenue: 0 }
  );
  return [...sorted.slice(0, top), rest];
}

/** Pembagian sumber reservasi. Nilai sah: WALK_IN, ADMIN, selainnya dianggap Online. */
export function sourceSplit(bookings: Pick<StatBooking, "source" | "status">[]) {
  let online = 0;
  let walkIn = 0;
  let admin = 0;
  for (const booking of bookings) {
    if (!isActiveStatus(booking.status)) continue;
    if (booking.source === "WALK_IN") walkIn += 1;
    else if (booking.source === "ADMIN") admin += 1;
    else online += 1;
  }
  return { online, walkIn, admin, total: online + walkIn + admin };
}

/** Selisih hari ini terhadap kemarin. `pct` null bila kemarin 0 (tidak ada pembanding). */
export function compareToYesterday(today: number, yesterday: number) {
  const delta = today - yesterday;
  const pct = yesterday > 0 ? Math.round((delta / yesterday) * 100) : null;
  return { delta, pct, same: delta === 0 };
}

/** Porsi `part` terhadap `whole` dalam persen bulat; 0 bila `whole` 0. */
export function percentOf(part: number, whole: number): number {
  if (!whole || whole <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}
