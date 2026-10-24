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
