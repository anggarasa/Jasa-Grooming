export type SlotUnavailableReason =
  | "OUTSIDE_HOURS"
  | "CLOSED"
  | "BREAK"
  | "PAST"
  | "MIN_ADVANCE"
  | "MAX_ADVANCE"
  | "BOOKED"
  | "BLOCKED"
  | "BOOKING_DISABLED"
  | "NO_RESOURCE"
  | "EXTERNAL_BUSY";

export interface TimeSlot {
  time: string; // "HH:mm", e.g. "09:00"
  startAt: string; // ISO 8601 UTC
  endAt: string; // ISO 8601 UTC (service completion time)
  occupancyEndAt: string; // ISO 8601 UTC (service completion + buffer time)
  available: boolean;
  reason?: SlotUnavailableReason;
}

export interface AvailabilityResult {
  date: string; // "YYYY-MM-DD"
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  bufferMinutes: number;
  effectiveBufferMinutes: number;
  totalOccupancyMinutes: number;
  resourceId: string;
  resourceName: string;
  isOpen: boolean;
  slots: TimeSlot[];
}
