import * as React from "react";
import { Badge } from "@/components/ui/badge";

export type ConflictStatus =
  | "PENDING"
  | "RESOLVED_KEEP_LOCAL"
  | "RESOLVED_OVERWRITE_LOCAL"
  | "IGNORED";

export interface ConflictStatusBadgeProps {
  status: ConflictStatus | string;
  className?: string;
  showDot?: boolean;
}

const CONFLICT_CONFIG: Record<
  string,
  {
    label: string;
    variant:
      | "conflictUnresolved"
      | "conflictResolvedLocal"
      | "conflictResolvedGoogle"
      | "conflictIgnored";
    dotColor: string;
  }
> = {
  PENDING: {
    label: "Perlu Resolusi",
    variant: "conflictUnresolved",
    dotColor: "bg-amber-600",
  },
  RESOLVED_KEEP_LOCAL: {
    label: "Pulihkan ke Google",
    variant: "conflictResolvedLocal",
    dotColor: "bg-teal-600",
  },
  RESOLVED_OVERWRITE_LOCAL: {
    label: "Ikuti Google / Dibatalkan",
    variant: "conflictResolvedGoogle",
    dotColor: "bg-blue-600",
  },
  IGNORED: {
    label: "Diabaikan",
    variant: "conflictIgnored",
    dotColor: "bg-slate-500",
  },
};

export function ConflictStatusBadge({
  status,
  className,
  showDot = true,
}: ConflictStatusBadgeProps) {
  const normalizedKey = (status || "PENDING").toUpperCase();
  const config = CONFLICT_CONFIG[normalizedKey] || CONFLICT_CONFIG.PENDING;

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

export function ConflictTypeBadge({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  let label = type;
  let variant: "conflictOverlapping" | "conflictExternalClash" | "conflictTimezoneMismatch" | "outline" = "outline";

  switch (type) {
    case "REMOTE_DELETED":
      label = "Dihapus di Google";
      variant = "conflictExternalClash";
      break;
    case "REMOTE_MODIFIED":
      label = "Diubah di Google";
      variant = "conflictOverlapping";
      break;
    case "TIME_OVERLAP":
      label = "Tumpang Tindih Jadwal";
      variant = "conflictOverlapping";
      break;
    case "TIMEZONE_MISMATCH":
      label = "Beda Zona Waktu";
      variant = "conflictTimezoneMismatch";
      break;
    default:
      label = type;
      variant = "outline";
  }

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
