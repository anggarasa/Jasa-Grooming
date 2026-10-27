import { describe, it, expect } from "vitest";
import { generateBookingCode } from "@backend/modules/bookings/code-generator";
import {
  generateGuestToken,
  hashGuestToken,
} from "@backend/modules/bookings/token.service";
import {
  hashIdempotencyKey,
  computeRequestFingerprint,
} from "@backend/modules/bookings/idempotency.service";
import { computeResourceLockId } from "@backend/modules/bookings/concurrency-lock";

describe("Booking Utilities — Code, Tokens & Concurrency Locks", () => {
  it("menghasilkan kode booking dengan format GRM-YYYYMMDD-XXXX", () => {
    const fixedDate = new Date("2026-10-24T05:00:00.000Z");
    const code = generateBookingCode(fixedDate);

    expect(code).toMatch(/^GRM-20261024-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
    expect(code.length).toBe(17);
  });

  it("menghasilkan kode booking acak yang unik pada setiap panggilan", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(generateBookingCode());
    }
    expect(codes.size).toBe(50);
  });

  it("menghasilkan dan memverifikasi Guest Access Token dengan hash SHA-256 yang aman", () => {
    const { rawToken, tokenHash } = generateGuestToken();

    expect(rawToken).toBeDefined();
    expect(rawToken.length).toBe(64); // 32 bytes hex = 64 chars
    expect(tokenHash).toBeDefined();
    expect(tokenHash.length).toBe(64);

    // Hash dari rawToken harus sama persis dengan tokenHash
    const computedHash = hashGuestToken(rawToken);
    expect(computedHash).toBe(tokenHash);

    // Token berbeda menghasilkan hash berbeda
    const another = generateGuestToken();
    expect(another.tokenHash).not.toBe(tokenHash);
  });

  it("menghitung fingerprint permintaan secara konsisten dan mendeteksi perubahan payload", () => {
    const payloadA = { serviceId: "srv-1", date: "2026-10-25", time: "09:00" };
    const payloadB = { serviceId: "srv-1", date: "2026-10-25", time: "09:00" };
    const payloadC = { serviceId: "srv-1", date: "2026-10-25", time: "10:00" };
    const payloadShuffled = { time: "09:00", serviceId: "srv-1", date: "2026-10-25" };

    const fpA = computeRequestFingerprint(payloadA);
    const fpB = computeRequestFingerprint(payloadB);
    const fpC = computeRequestFingerprint(payloadC);
    const fpShuffled = computeRequestFingerprint(payloadShuffled);

    expect(fpA).toBe(fpB);
    expect(fpA).toBe(fpShuffled);
    expect(fpA).not.toBe(fpC);

    const keyHash1 = hashIdempotencyKey("idem-key-123");
    const keyHash2 = hashIdempotencyKey("idem-key-123");
    expect(keyHash1).toBe(keyHash2);
  });

  it("menghasilkan ID advisory lock 32-bit yang deterministik untuk ID station", () => {
    const lockId1 = computeResourceLockId("station-main");
    const lockId2 = computeResourceLockId("station-main");
    const lockIdOther = computeResourceLockId("station-secondary");

    expect(lockId1).toBe(lockId2);
    expect(typeof lockId1).toBe("number");
    expect(lockId1).not.toBe(lockIdOther);
    // Memastikan berada dalam rentang integer 32-bit bertanda
    expect(lockId1).toBeGreaterThanOrEqual(-2147483648);
    expect(lockId1).toBeLessThanOrEqual(2147483647);
  });
});
