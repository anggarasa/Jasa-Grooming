import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        accent:
          "border-transparent bg-accent text-accent-foreground hover:bg-accent/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
        owner:
          "border-badge-owner-border bg-badge-owner text-badge-owner-foreground",
        admin:
          "border-badge-admin-border bg-badge-admin text-badge-admin-foreground",
        sessionActive:
          "border-session-active-border bg-session-active text-session-active-foreground",
        open:
          "border-badge-open-border bg-badge-open text-badge-open-foreground",
        closed:
          "border-badge-closed-border bg-badge-closed text-badge-closed-foreground",
        active:
          "border-badge-active-border bg-badge-active text-badge-active-foreground",
        inactive:
          "border-badge-inactive-border bg-badge-inactive text-badge-inactive-foreground",
        breakSlot:
          "border-badge-break-border bg-badge-break text-badge-break-foreground",
        duration:
          "border-badge-duration-border bg-badge-duration text-badge-duration-foreground",
        bookingPending:
          "border-badge-booking-pending-border bg-badge-booking-pending text-badge-booking-pending-foreground",
        bookingConfirmed:
          "border-badge-booking-confirmed-border bg-badge-booking-confirmed text-badge-booking-confirmed-foreground",
        bookingCheckedIn:
          "border-badge-booking-checked-in-border bg-badge-booking-checked-in text-badge-booking-checked-in-foreground",
        bookingInProgress:
          "border-badge-booking-in-progress-border bg-badge-booking-in-progress text-badge-booking-in-progress-foreground",
        bookingCompleted:
          "border-badge-booking-completed-border bg-badge-booking-completed text-badge-booking-completed-foreground",
        bookingCancelled:
          "border-badge-booking-cancelled-border bg-badge-booking-cancelled text-badge-booking-cancelled-foreground",
        bookingNoShow:
          "border-badge-booking-no-show-border bg-badge-booking-no-show text-badge-booking-no-show-foreground",
        walkIn:
          "border-badge-walk-in-border bg-badge-walk-in text-badge-walk-in-foreground",
        // Google Calendar Connection Status
        syncNotConnected:
          "border-badge-sync-not-connected-border bg-badge-sync-not-connected text-badge-sync-not-connected-foreground",
        syncConnected:
          "border-badge-sync-connected-border bg-badge-sync-connected text-badge-sync-connected-foreground",
        syncSyncing:
          "border-badge-sync-syncing-border bg-badge-sync-syncing text-badge-sync-syncing-foreground",
        syncDegraded:
          "border-badge-sync-degraded-border bg-badge-sync-degraded text-badge-sync-degraded-foreground",
        syncReauthRequired:
          "border-badge-sync-reauth-required-border bg-badge-sync-reauth-required text-badge-sync-reauth-required-foreground",
        syncError:
          "border-badge-sync-error-border bg-badge-sync-error text-badge-sync-error-foreground",
        // Sync Outbox Queue Job Status
        jobPending:
          "border-badge-job-pending-border bg-badge-job-pending text-badge-job-pending-foreground",
        jobProcessing:
          "border-badge-job-processing-border bg-badge-job-processing text-badge-job-processing-foreground",
        jobCompleted:
          "border-badge-job-completed-border bg-badge-job-completed text-badge-job-completed-foreground",
        jobFailed:
          "border-badge-job-failed-border bg-badge-job-failed text-badge-job-failed-foreground",
        jobDeadLetter:
          "border-badge-job-dead-letter-border bg-badge-job-dead-letter text-badge-job-dead-letter-foreground",
        // Conflict Status
        conflictUnresolved:
          "border-badge-conflict-unresolved-border bg-badge-conflict-unresolved text-badge-conflict-unresolved-foreground",
        conflictResolvedLocal:
          "border-badge-conflict-resolved-local-border bg-badge-conflict-resolved-local text-badge-conflict-resolved-local-foreground",
        conflictResolvedGoogle:
          "border-badge-conflict-resolved-google-border bg-badge-conflict-resolved-google text-badge-conflict-resolved-google-foreground",
        conflictManualOverride:
          "border-badge-conflict-manual-override-border bg-badge-conflict-manual-override text-badge-conflict-manual-override-foreground",
        conflictIgnored:
          "border-badge-conflict-ignored-border bg-badge-conflict-ignored text-badge-conflict-ignored-foreground",
        // Conflict Type
        conflictOverlapping:
          "border-badge-conflict-overlapping-border bg-badge-conflict-overlapping text-badge-conflict-overlapping-foreground",
        conflictExternalClash:
          "border-badge-conflict-external-clash-border bg-badge-conflict-external-clash text-badge-conflict-external-clash-foreground",
        conflictTimezoneMismatch:
          "border-badge-conflict-timezone-mismatch-border bg-badge-conflict-timezone-mismatch text-badge-conflict-timezone-mismatch-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
