import * as React from "react";
import { BookingStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

export interface BookingStatusBadgeProps {
  status: BookingStatus | string;
  className?: string;
}

export interface BookingSourceBadgeProps {
  source?: string | null;
  className?: string;
}

export const STATUS_LABELS: Record<string, string> = {
  [BookingStatus.PENDING]: "Menunggu",
  [BookingStatus.CONFIRMED]: "Dikonfirmasi",
  [BookingStatus.CHECKED_IN]: "Check-in",
  [BookingStatus.IN_PROGRESS]: "Sedang Dikerjakan",
  [BookingStatus.COMPLETED]: "Selesai",
  [BookingStatus.CANCELLED]: "Dibatalkan",
  [BookingStatus.NO_SHOW]: "Tidak Hadir",
};

export const STATUS_BADGE_VARIANTS: Record<
  string,
  | "bookingPending"
  | "bookingConfirmed"
  | "bookingCheckedIn"
  | "bookingInProgress"
  | "bookingCompleted"
  | "bookingCancelled"
  | "bookingNoShow"
  | "default"
> = {
  [BookingStatus.PENDING]: "bookingPending",
  [BookingStatus.CONFIRMED]: "bookingConfirmed",
  [BookingStatus.CHECKED_IN]: "bookingCheckedIn",
  [BookingStatus.IN_PROGRESS]: "bookingInProgress",
  [BookingStatus.COMPLETED]: "bookingCompleted",
  [BookingStatus.CANCELLED]: "bookingCancelled",
  [BookingStatus.NO_SHOW]: "bookingNoShow",
};

export function BookingStatusBadge({
  status,
  className,
}: BookingStatusBadgeProps) {
  const label = STATUS_LABELS[status] || status;
  const variant = STATUS_BADGE_VARIANTS[status] || "default";

  return (
    <Badge variant={variant} className={className}>
      <span className="inline-block h-1.5 w-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {label}
    </Badge>
  );
}

/**
 * Label manusiawi untuk nilai `source` di database. Nilai yang sah hanya
 * WALK_IN, ADMIN, dan bawaan PUBLIC_GUEST (lihat admin-schemas.ts).
 * Dipakai bersama oleh lencana dan halaman detail agar teksnya selalu sama
 * dan nilai mentah tidak pernah bocor ke layar.
 */
export function getBookingSourceLabel(source?: string | null): string {
  if (source === "WALK_IN") return "Walk-in";
  if (source === "ADMIN") return "Admin";
  return "Online";
}

export function BookingSourceBadge({
  source,
  className,
}: BookingSourceBadgeProps) {
  if (!source) return null;

  if (source === "WALK_IN") {
    return (
      <Badge variant="walkIn" className={className}>
        Walk-in
      </Badge>
    );
  }

  if (source === "ADMIN") {
    return (
      <Badge variant="admin" className={className}>
        Admin
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={className}>
      Online
    </Badge>
  );
}
