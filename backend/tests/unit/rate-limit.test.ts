import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimit,
  clearRateLimitStore,
} from "@backend/modules/auth/rate-limit.service";

describe("Rate Limiter Service (checkRateLimit)", () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it("mengizinkan request dalam batas maksimum", () => {
    const key = "test:user1";
    const res1 = checkRateLimit(key, 3, 60);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(key, 3, 60);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(key, 3, 60);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("memblokir request saat melebihi kuota dan mengembalikan retryAfterSeconds", () => {
    const key = "test:user2";
    checkRateLimit(key, 2, 60);
    checkRateLimit(key, 2, 60);

    const blocked = checkRateLimit(key, 2, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("dapat mereset batas kuota dengan resetRateLimit", () => {
    const key = "test:user3";
    checkRateLimit(key, 1, 60);
    const blocked = checkRateLimit(key, 1, 60);
    expect(blocked.allowed).toBe(false);

    resetRateLimit(key);
    const retry = checkRateLimit(key, 1, 60);
    expect(retry.allowed).toBe(true);
    expect(retry.remaining).toBe(0);
  });
});
