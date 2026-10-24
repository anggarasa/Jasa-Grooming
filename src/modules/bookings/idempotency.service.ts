import crypto from "crypto";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class IdempotencyError extends Error {
  constructor(
    message: string,
    public statusCode = 422,
    public code = "IDEMPOTENCY_CONFLICT"
  ) {
    super(message);
    this.name = "IdempotencyError";
  }
}

export function hashIdempotencyKey(key: string): string {
  return crypto.createHash("sha256").update(key.trim()).digest("hex");
}

function canonicalStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalStringify).join(",")}]`;
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const entries = keys.map(
    (k) => `${JSON.stringify(k)}:${canonicalStringify((obj as Record<string, unknown>)[k])}`
  );
  return `{${entries.join(",")}}`;
}

export function computeRequestFingerprint(payload: unknown): string {
  const serialized = typeof payload === "string" ? payload : canonicalStringify(payload);
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

export interface IdempotencyCheckResult {
  isDuplicate: boolean;
  cachedResponse?: unknown;
}

/**
 * Checks if an idempotency key was previously processed.
 */
export async function checkIdempotency(
  rawKey: string,
  requestFingerprint: string
): Promise<IdempotencyCheckResult> {
  const keyHash = hashIdempotencyKey(rawKey);

  const existing = await prisma.bookingIdempotency.findUnique({
    where: { keyHash },
  });

  if (!existing) {
    return { isDuplicate: false };
  }

  // If expired, let it proceed
  if (existing.expiresAt.getTime() <= Date.now()) {
    return { isDuplicate: false };
  }

  // Validate fingerprint
  if (existing.requestFingerprint !== requestFingerprint) {
    throw new IdempotencyError(
      "Kunci idempotensi ini telah digunakan dengan parameter permintaan yang berbeda.",
      422,
      "IDEMPOTENCY_MISMATCH"
    );
  }

  return {
    isDuplicate: true,
    cachedResponse: existing.responsePayload,
  };
}

/**
 * Saves idempotency record within an atomic Prisma transaction.
 */
export async function saveIdempotencyRecord(
  tx: Prisma.TransactionClient,
  rawKey: string,
  requestFingerprint: string,
  bookingId: string,
  responsePayload: unknown
): Promise<void> {
  const keyHash = hashIdempotencyKey(rawKey);
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000); // 24 hours

  await tx.bookingIdempotency.upsert({
    where: { keyHash },
    update: {
      requestFingerprint,
      bookingId,
      responsePayload: responsePayload as Prisma.InputJsonValue,
      expiresAt,
    },
    create: {
      keyHash,
      requestFingerprint,
      bookingId,
      responsePayload: responsePayload as Prisma.InputJsonValue,
      expiresAt,
    },
  });
}
