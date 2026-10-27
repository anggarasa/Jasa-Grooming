import { hash, verify } from "@node-rs/argon2";
import bcrypt from "bcryptjs";

export interface PasswordPolicyResult {
  valid: boolean;
  error?: string;
}

/**
 * Validasi kepatuhan kebijakan kata sandi:
 * - Minimal 12 karakter
 * - Minimal 1 huruf kapital
 * - Minimal 1 huruf kecil
 * - Minimal 1 angka
 * - Minimal 1 simbol khusus
 */
export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  if (!password || password.length < 12) {
    return {
      valid: false,
      error: "Kata sandi minimal harus 12 karakter",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: "Kata sandi harus mengandung minimal 1 huruf kapital (A-Z)",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: "Kata sandi harus mengandung minimal 1 huruf kecil (a-z)",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      error: "Kata sandi harus mengandung minimal 1 angka (0-9)",
    };
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      valid: false,
      error: "Kata sandi harus mengandung minimal 1 simbol / karakter khusus",
    };
  }

  return { valid: true };
}

/**
 * Hash password menggunakan Argon2id (standar OWASP).
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

/**
 * Verifikasi kecocokan password terhadap hash.
 * Mendukung hash Argon2id ($argon2) serta backward-compatible dengan legacy bcrypt ($2a$, $2b$).
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<{ matches: boolean; needsRehash: boolean }> {
  if (!storedHash || !password) {
    return { matches: false, needsRehash: false };
  }

  // Jika hash tersimpan adalah bcrypt (legacy dari seed Phase 01)
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")) {
    try {
      const isBcryptMatch = await bcrypt.compare(password, storedHash);
      return { matches: isBcryptMatch, needsRehash: isBcryptMatch };
    } catch {
      return { matches: false, needsRehash: false };
    }
  }

  // Standar Argon2id
  try {
    const isArgonMatch = await verify(storedHash, password);
    return { matches: isArgonMatch, needsRehash: false };
  } catch {
    return { matches: false, needsRehash: false };
  }
}
