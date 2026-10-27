/**
 * Helper format tanggal Indonesia yang aman untuk SSR dan Client.
 */
export function formatIndonesianDate(
  dateInput?: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "-";
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "-";

    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
      ...options,
    };

    return new Intl.DateTimeFormat("id-ID", defaultOptions).format(date);
  } catch {
    return "-";
  }
}

/**
 * HANYA tanggal, tanpa jam. "26 Okt 2026".
 *
 * Perlu fungsi tersendiri karena `formatIndonesianDate` selalu menyertakan jam
 * sebagai bawaan: memanggilnya dengan `{ day, month, year }` saja tidak
 * menghilangkan jamnya, sehingga baris tanggal ikut memuat jam.
 */
export function formatIndonesianDateOnly(dateInput?: string | Date | null): string {
  return formatIndonesianDate(dateInput, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: undefined,
    minute: undefined,
  });
}

/**
 * Rentang waktu. Bila mulai & selesai jatuh pada hari yang sama (WIB), tanggalnya
 * hanya ditulis sekali: "29 Okt 2026, 15.00 - 16.45". Bila berbeda hari, keduanya
 * ditulis lengkap. Tanpa ini, rentang selalu mengulang tanggal yang sama dua kali.
 */
export function formatIndonesianTimeRange(
  startInput?: string | Date | null,
  endInput?: string | Date | null
): string {
  const day = (d?: string | Date | null) => formatIndonesianDateOnly(d);
  if (!startInput || !endInput) return formatIndonesianDate(startInput);
  if (day(startInput) === day(endInput)) {
    return `${day(startInput)}, ${formatIndonesianTime(startInput)} - ${formatIndonesianTime(endInput)}`;
  }
  return `${formatIndonesianDate(startInput)} - ${formatIndonesianDate(endInput)}`;
}

/**
 * HANYA jam, tanpa tanggal. "09.00".
 *
 * Alasannya sama: memanggil `formatIndonesianDate` dengan `{ hour, minute }`
 * saja akan tetap memunculkan tanggalnya.
 */
export function formatIndonesianTime(dateInput?: string | Date | null): string {
  return formatIndonesianDate(dateInput, {
    day: undefined,
    month: undefined,
    year: undefined,
    hour: "2-digit",
    minute: "2-digit",
  });
}
