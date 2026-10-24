interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store untuk rate limiter (cocok untuk single-instance deployment tanpa Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Pembersihan rutin setiap 5 menit
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  if (cleanupTimer && typeof cleanupTimer.unref === "function") {
    cleanupTimer.unref();
  }
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * Cek dan catat konsumsi kuota rate limit (Sliding Fixed-Window).
 *
 * @param key Identifier unik (misalnya: `login:192.168.1.1` atau `auth:refresh:userId`)
 * @param maxRequests Batas maksimal request dalam interval window
 * @param windowSeconds Durasi window dalam satuan detik
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): RateLimitCheckResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds,
    };
  }

  current.count += 1;
  const remaining = maxRequests - current.count;
  return {
    allowed: true,
    remaining,
    resetAt: current.resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Reset kuota rate limit untuk key tertentu (misal setelah login berhasil)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Helper membersihkan seluruh store (berguna untuk testing)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}
