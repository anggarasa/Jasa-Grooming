import { BookingStatus } from "@prisma/client";

export class InvalidStatusTransitionError extends Error {
  constructor(
    public fromStatus: BookingStatus,
    public toStatus: BookingStatus,
    message?: string
  ) {
    super(
      message ||
        `Perubahan status dari "${fromStatus}" ke "${toStatus}" tidak diizinkan dalam alur kerja reservasi.`
    );
    this.name = "InvalidStatusTransitionError";
  }
}

/**
 * Valid state transitions mapping for PawCare booking lifecycle:
 * PENDING -> CONFIRMED | CANCELLED
 * CONFIRMED -> CHECKED_IN | CANCELLED | NO_SHOW | COMPLETED
 * CHECKED_IN -> IN_PROGRESS | CANCELLED | COMPLETED
 * IN_PROGRESS -> COMPLETED | CANCELLED
 * Terminal: COMPLETED, CANCELLED, NO_SHOW
 */
const ALLOWED_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [
    BookingStatus.CHECKED_IN,
    BookingStatus.CANCELLED,
    BookingStatus.NO_SHOW,
    BookingStatus.COMPLETED,
  ],
  [BookingStatus.CHECKED_IN]: [
    BookingStatus.IN_PROGRESS,
    BookingStatus.CANCELLED,
    BookingStatus.COMPLETED,
  ],
  [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.NO_SHOW]: [],
};

/**
 * Checks whether transitioning from `from` to `to` is permitted.
 * Same status transition (from === to) is considered valid (no-op).
 */
export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  if (from === to) {
    return true;
  }
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Asserts that the transition is valid, or throws InvalidStatusTransitionError.
 */
export function assertValidTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidStatusTransitionError(from, to);
  }
}

const TERMINAL_STATUSES: BookingStatus[] = [
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
  BookingStatus.NO_SHOW,
];

/**
 * Checks if a booking status is a terminal state (cannot be altered).
 */
export function isTerminalStatus(status: BookingStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
