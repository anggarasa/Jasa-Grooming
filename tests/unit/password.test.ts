import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  validatePasswordPolicy,
} from "@/modules/auth/password.service";
import bcrypt from "bcryptjs";

describe("Password Service (Argon2id & Policy)", () => {
  describe("validatePasswordPolicy", () => {
    it("menolak password yang kurang dari 12 karakter", () => {
      const result = validatePasswordPolicy("Short123!A");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("12 karakter");
    });

    it("menolak password tanpa huruf kapital", () => {
      const result = validatePasswordPolicy("lowercase123!@#");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("huruf kapital");
    });

    it("menolak password tanpa huruf kecil", () => {
      const result = validatePasswordPolicy("UPPERCASE123!@#");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("huruf kecil");
    });

    it("menolak password tanpa angka", () => {
      const result = validatePasswordPolicy("NoNumbersHere!@#");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("angka");
    });

    it("menolak password tanpa simbol khusus", () => {
      const result = validatePasswordPolicy("NoSymbols123456");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("simbol");
    });

    it("menerima password kuat yang memenuhi seluruh kebijakan", () => {
      const result = validatePasswordPolicy("PawCareGrooming2026!#");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("hashPassword & verifyPassword", () => {
    it("menghasilkan hash Argon2id berformat $argon2id$", async () => {
      const plain = "ValidPassword2026!#";
      const hash = await hashPassword(plain);

      expect(hash).toMatch(/^\$argon2id\$/);
      expect(hash).toContain("m=19456,t=2,p=1");
    });

    it("berhasil memverifikasi password yang benar dengan Argon2id", async () => {
      const plain = "ValidPassword2026!#";
      const hash = await hashPassword(plain);

      const verification = await verifyPassword(plain, hash);
      expect(verification.matches).toBe(true);
      expect(verification.needsRehash).toBe(false);
    });

    it("menolak password yang salah", async () => {
      const plain = "ValidPassword2026!#";
      const hash = await hashPassword(plain);

      const verification = await verifyPassword("WrongPassword123!", hash);
      expect(verification.matches).toBe(false);
    });

    it("mendukung verifikasi legacy bcrypt dan menandai needsRehash: true", async () => {
      const plain = "LegacyBcryptPassword123!";
      const bcryptHash = await bcrypt.hash(plain, 10);

      const verification = await verifyPassword(plain, bcryptHash);
      expect(verification.matches).toBe(true);
      expect(verification.needsRehash).toBe(true);
    });
  });
});
