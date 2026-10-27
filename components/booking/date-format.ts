/**
 * Format tanggal untuk tampilan booking (zona waktu operasional: Asia/Jakarta).
 * Hanya memformat string "YYYY-MM-DD"; tidak menentukan ketersediaan apa pun.
 */
function toNoonUtc(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/** Contoh: "Sabtu, 24 Oktober 2026". String kosong bila `dateStr` kosong. */
export function formatFullDateIndo(dateStr: string): string {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(toNoonUtc(dateStr));
}

/** Contoh: "24 Oktober 2026". */
export function formatLongDateIndo(dateStr: string): string {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(toNoonUtc(dateStr));
}

/** Contoh: "Minggu". Hari dalam seminggu untuk tanggal kalender "YYYY-MM-DD". */
export function formatWeekdayIndo(dateStr: string): string {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", timeZone: "Asia/Jakarta" }).format(
    toNoonUtc(dateStr)
  );
}
