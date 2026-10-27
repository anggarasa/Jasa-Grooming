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

