import * as React from "react";
import { Badge } from "@/components/ui/badge";

export type CalendarConnectionStatus =
  | "NOT_CONNECTED"
  | "DISCONNECTED"
  | "CONNECTED"
  | "ACTIVE"
  | "SYNCING"
  | "DEGRADED"
  | "REAUTH_REQUIRED"
  | "ERROR";

export interface CalendarStatusBadgeProps {
  status?: CalendarConnectionStatus | string | null;
  className?: string;
  showDot?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant:
      | "syncNotConnected"
      | "syncConnected"
      | "syncSyncing"
      | "syncDegraded"
      | "syncReauthRequired"
      | "syncError";
    dotColor: string;
  }
> = {
  NOT_CONNECTED: {
    label: "Belum Terhubung",
    variant: "syncNotConnected",
    dotColor: "bg-slate-400",
  },
  DISCONNECTED: {
    label: "Terputus",
    variant: "syncNotConnected",
    dotColor: "bg-slate-400",
  },
  CONNECTED: {
    label: "Terhubung",
    variant: "syncConnected",
    dotColor: "bg-emerald-600",
  },
  ACTIVE: {
    label: "Terhubung Aktif",
    variant: "syncConnected",
    dotColor: "bg-emerald-600",
  },
  SYNCING: {
    label: "Menyinkronkan",
    variant: "syncSyncing",
    dotColor: "bg-sky-600 animate-pulse",
  },
  DEGRADED: {
    label: "Sinkronisasi Terdegradasi",
    variant: "syncDegraded",
    dotColor: "bg-amber-600",
  },
  REAUTH_REQUIRED: {
    label: "Perlu Autentikasi Ulang",
    variant: "syncReauthRequired",
    dotColor: "bg-orange-600",
  },
  ERROR: {
    label: "Gagal / Terkendala",
    variant: "syncError",
    dotColor: "bg-rose-600",
  },
};

export function CalendarStatusBadge({
  status,
  className,
  showDot = true,
}: CalendarStatusBadgeProps) {
  const normalizedKey = (status || "NOT_CONNECTED").toUpperCase();
  const config = STATUS_CONFIG[normalizedKey] || STATUS_CONFIG.NOT_CONNECTED;

  return (
    <Badge variant={config.variant} className={className}>
      {showDot && (
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 shrink-0 ${config.dotColor}`}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}
