import { describe, it, expect } from "vitest";
import { BookingStatus } from "@prisma/client";
import {
  canTransition,
  assertValidTransition,
  isTerminalStatus,
  InvalidStatusTransitionError,
} from "@/modules/bookings/state-machine";

describe("Booking State Machine", () => {
  it("izinkan transisi valid dari PENDING ke CONFIRMED dan CANCELLED", () => {
    expect(canTransition(BookingStatus.PENDING, BookingStatus.CONFIRMED)).toBe(true);
    expect(canTransition(BookingStatus.PENDING, BookingStatus.CANCELLED)).toBe(true);
    expect(canTransition(BookingStatus.PENDING, BookingStatus.IN_PROGRESS)).toBe(false);
    expect(canTransition(BookingStatus.PENDING, BookingStatus.COMPLETED)).toBe(false);
  });

  it("izinkan transisi dari CONFIRMED ke CHECKED_IN, NO_SHOW, CANCELLED, COMPLETED", () => {
    expect(canTransition(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN)).toBe(true);
    expect(canTransition(BookingStatus.CONFIRMED, BookingStatus.NO_SHOW)).toBe(true);
    expect(canTransition(BookingStatus.CONFIRMED, BookingStatus.CANCELLED)).toBe(true);
    expect(canTransition(BookingStatus.CONFIRMED, BookingStatus.COMPLETED)).toBe(true);
    expect(canTransition(BookingStatus.CONFIRMED, BookingStatus.PENDING)).toBe(false);
  });

  it("izinkan transisi dari CHECKED_IN ke IN_PROGRESS, CANCELLED, COMPLETED", () => {
    expect(canTransition(BookingStatus.CHECKED_IN, BookingStatus.IN_PROGRESS)).toBe(true);
    expect(canTransition(BookingStatus.CHECKED_IN, BookingStatus.CANCELLED)).toBe(true);
    expect(canTransition(BookingStatus.CHECKED_IN, BookingStatus.COMPLETED)).toBe(true);
    expect(canTransition(BookingStatus.CHECKED_IN, BookingStatus.PENDING)).toBe(false);
  });

  it("izinkan transisi dari IN_PROGRESS ke COMPLETED dan CANCELLED", () => {
    expect(canTransition(BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED)).toBe(true);
    expect(canTransition(BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED)).toBe(true);
    expect(canTransition(BookingStatus.IN_PROGRESS, BookingStatus.CONFIRMED)).toBe(false);
  });

  it("tolak setiap transisi dari status terminal: COMPLETED, CANCELLED, NO_SHOW", () => {
    const terminalStatuses = [
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
      BookingStatus.NO_SHOW,
    ];

    for (const terminal of terminalStatuses) {
      expect(isTerminalStatus(terminal)).toBe(true);
      expect(canTransition(terminal, BookingStatus.CONFIRMED)).toBe(false);
      expect(canTransition(terminal, BookingStatus.IN_PROGRESS)).toBe(false);
      expect(canTransition(terminal, BookingStatus.PENDING)).toBe(false);
    }
  });

  it("anggap transisi ke status yang sama (no-op) sebagai valid", () => {
    expect(canTransition(BookingStatus.CONFIRMED, BookingStatus.CONFIRMED)).toBe(true);
    expect(canTransition(BookingStatus.COMPLETED, BookingStatus.COMPLETED)).toBe(true);
  });

  it("assertValidTransition melempar InvalidStatusTransitionError jika tidak valid", () => {
    expect(() =>
      assertValidTransition(BookingStatus.CANCELLED, BookingStatus.CONFIRMED)
    ).toThrow(InvalidStatusTransitionError);

    expect(() =>
      assertValidTransition(BookingStatus.PENDING, BookingStatus.CONFIRMED)
    ).not.toThrow();
  });
});
