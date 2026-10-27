import { describe, it, expect } from "vitest";
import {
  encrypt,
  decrypt,
  generateOAuthState,
  verifyOAuthState,
  hashWebhookToken,
} from "@backend/lib/encryption";

describe("Google Integration Security — AES-256-GCM & OAuth State", () => {
  const secretKey = "test-secret-key-at-least-32-chars-long-security!";

  describe("AES-256-GCM Encryption / Decryption", () => {
    it("berhasil mengenkripsi dan mendekripsi string token dengan benar", () => {
      const plaintext = "ya29.a0AfH6SMA...google-super-secret-refresh-token";
      const encrypted = encrypt(plaintext, secretKey);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.split(":")).toHaveLength(3); // iv:tag:data

      const decrypted = decrypt(encrypted, secretKey);
      expect(decrypted).toBe(plaintext);
    });

    it("mengembalikan string kosong jika input plaintext kosong", () => {
      expect(encrypt("", secretKey)).toBe("");
      expect(decrypt("", secretKey)).toBe("");
    });

    it("menolak dekripsi jika format ciphertext tidak sesuai struktur 3 bagian", () => {
      expect(() => decrypt("invalid-cipher-format", secretKey)).toThrow(
        "Format data terenkripsi tidak valid."
      );
    });

    it("menolak dekripsi jika ciphertext atau auth tag telah diutak-atik (tampered)", () => {
      const plaintext = "token-rahasia-google";
      const encrypted = encrypt(plaintext, secretKey);
      const [ivHex, tagHex, dataHex] = encrypted.split(":");

      // Ubah 1 karakter pada ciphertext data
      const tamperedData = dataHex.slice(0, -2) + (dataHex.endsWith("00") ? "11" : "00");
      const tamperedCipher = `${ivHex}:${tagHex}:${tamperedData}`;

      expect(() => decrypt(tamperedCipher, secretKey)).toThrow(
        "verifikasi integritas data (auth tag) gagal"
      );
    });

    it("menolak dekripsi jika kunci dekripsi berbeda", () => {
      const plaintext = "sensitif-token-data";
      const encrypted = encrypt(plaintext, secretKey);
      const wrongKey = "different-secret-key-32-chars-length-here!";

      expect(() => decrypt(encrypted, wrongKey)).toThrow(
        "verifikasi integritas data (auth tag) gagal"
      );
    });
  });

  describe("HMAC-SHA256 Signed OAuth State", () => {
    it("menghasilkan token state bertanda tangan dan memvalidasinya secara presisi", () => {
      const state = generateOAuthState({
        businessId: "biz_12345",
        userId: "usr_owner_999",
      });

      expect(state).toBeDefined();
      expect(state.split(".")).toHaveLength(2); // payloadBase64.signature

      const verified = verifyOAuthState(state);
      expect(verified.businessId).toBe("biz_12345");
      expect(verified.userId).toBe("usr_owner_999");
      expect(verified.nonce).toBeDefined();
      expect(typeof verified.timestamp).toBe("number");
    });

    it("menolak OAuth state jika tanda tangan diubah atau dipalsukan", () => {
      const state = generateOAuthState({
        businessId: "biz_12345",
        userId: "usr_owner_999",
      });
      const [payload, sig] = state.split(".");
      const forgedSig = sig.slice(0, -2) + (sig.endsWith("a") ? "b" : "a");
      const tamperedState = `${payload}.${forgedSig}`;

      expect(() => verifyOAuthState(tamperedState)).toThrow(
        "Tanda tangan OAuth state tidak valid"
      );
    });

    it("menolak OAuth state yang sudah kedaluwarsa (expired)", () => {
      const state = generateOAuthState({
        businessId: "biz_12345",
        userId: "usr_owner_999",
      });

      // Validitas 0ms agar langsung dianggap expired
      expect(() => verifyOAuthState(state, -100)).toThrow(
        "OAuth state telah kedaluwarsa"
      );
    });
  });

  describe("Webhook Token Hashing", () => {
    it("menghasilkan hash SHA-256 yang deterministik", () => {
      const token = "secret_webhook_verify_token_123";
      const hash1 = hashWebhookToken(token);
      const hash2 = hashWebhookToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });
});
