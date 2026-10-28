import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Satu sumber untuk format Rupiah (backend juga memakainya).
export { formatIDR } from "@backend/lib/currency";

/**
 * Membangun URL tautan WhatsApp resmi wa.me dengan nomor terformat dan pesan pembuka.
 */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message: string = ""
): string {
  if (!phone || phone.trim() === "") {
    return "#";
  }

  const digits = phone.replace(/\D/g, "");
  let formatted = digits;
  if (formatted.startsWith("0")) {
    formatted = "62" + formatted.slice(1);
  }

  if (!formatted) {
    return "#";
  }

  const encodedMsg = encodeURIComponent(message.trim());
  return encodedMsg
    ? `https://wa.me/${formatted}?text=${encodedMsg}`
    : `https://wa.me/${formatted}`;
}

export interface GoogleCalendarEventParams {
  title: string;
  startAt: string;
  endAt?: string;
  durationMinutes?: number;
  details?: string;
  location?: string;
}

/**
 * Memformat ISO string atau Date menjadi format tanggal kompak UTC untuk Google Calendar URL: YYYYMMDDTHHmmssZ
 */
function toGCalDateTime(dateInput: string | Date): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
}

/**
 * Membangun URL direct "Add to Google Calendar" untuk customer tanpa memerlukan login OAuth backend.
 * Menggunakan endpoint web standar Google Calendar: https://calendar.google.com/calendar/render?action=TEMPLATE
 */
export function buildCustomerGoogleCalendarUrl(params: GoogleCalendarEventParams): string {
  const { title, startAt, endAt, durationMinutes, details, location } = params;

  const startDate = new Date(startAt);
  let endDate: Date;

  if (endAt) {
    endDate = new Date(endAt);
  } else if (durationMinutes && durationMinutes > 0) {
    endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  } else {
    // Default 1 jam
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  }

  const datesParam = `${toGCalDateTime(startDate)}/${toGCalDateTime(endDate)}`;

  const queryParams = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: datesParam,
  });

  if (details && details.trim() !== "") {
    queryParams.set("details", details.trim());
  }

  if (location && location.trim() !== "") {
    queryParams.set("location", location.trim());
  }

  return `https://calendar.google.com/calendar/render?${queryParams.toString()}`;
}
