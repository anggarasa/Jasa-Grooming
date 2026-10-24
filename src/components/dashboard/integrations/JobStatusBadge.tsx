import * as React from "react";
import { Badge } from "@/components/ui/badge";

export type SyncJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "DEAD_LETTER";

export interface JobStatusBadgeProps {
  status: SyncJobStatus | string;
  className?: string;
  showDot?: boolean;
}

const JOB_CONFIG: Record<
  string,
  {
    label: string;
    variant:
      | "jobPending"
      | "jobProcessing"
      | "jobCompleted"
      | "jobFailed"
      | "jobDeadLetter";
    dotColor: string;
  }
> = {
  PENDING: {
    label: "Menunggu Antrean",
    variant: "jobPending",
    dotColor: "bg-amber-600",
  },
  PROCESSING: {
    label: "Sedang Diproses",
    variant: "jobProcessing",
    dotColor: "bg-sky-600 animate-pulse",
  },
  COMPLETED: {
    label: "Selesai",
    variant: "jobCompleted",
    dotColor: "bg-emerald-600",
  },
  FAILED: {
    label: "Gagal (Retrying)",
    variant: "jobFailed",
    dotColor: "bg-rose-600",
  },
  DEAD_LETTER: {
    label: "Gagal Permanen",
    variant: "jobDeadLetter",
    dotColor: "bg-purple-600",
  },
};

export function JobStatusBadge({
  status,
  className,
  showDot = true,
}: JobStatusBadgeProps) {
  const normalizedKey = (status || "PENDING").toUpperCase();
  const config = JOB_CONFIG[normalizedKey] || JOB_CONFIG.PENDING;

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
