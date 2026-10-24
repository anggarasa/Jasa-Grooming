/**
 * Validasi File Signature (Magic Bytes) untuk format gambar yang diizinkan (JPEG, PNG, WebP).
 * Menolak secara eksplisit format vektor (SVG), script, executable, atau file berbahaya lainnya.
 */

export type AllowedImageFormat = "image/jpeg" | "image/png" | "image/webp";

export interface MagicBytesValidationResult {
  valid: boolean;
  mimeType?: AllowedImageFormat;
  extension?: "jpg" | "png" | "webp";
  error?: string;
}

export function detectImageMagicBytes(buffer: Buffer): MagicBytesValidationResult {
  if (!buffer || buffer.length < 12) {
    return {
      valid: false,
      error: "Ukuran file terlalu kecil atau buffer tidak valid.",
    };
  }

  // 1. JPEG signature: FF D8 FF
  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return {
      valid: true,
      mimeType: "image/jpeg",
      extension: "jpg",
    };
  }

  // 2. PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return {
      valid: true,
      mimeType: "image/png",
      extension: "png",
    };
  }

  // 3. WebP signature:
  // Bytes 0-3: "RIFF" (0x52, 0x49, 0x46, 0x46)
  // Bytes 8-11: "WEBP" (0x57, 0x45, 0x42, 0x50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return {
      valid: true,
      mimeType: "image/webp",
      extension: "webp",
    };
  }

  // Deteksi percobaan upload SVG atau file teks/script berbasis XML / HTML
  const headerText = buffer.subarray(0, Math.min(buffer.length, 256)).toString("utf-8").toLowerCase();
  if (
    headerText.includes("<svg") ||
    headerText.includes("<?xml") ||
    headerText.includes("<html") ||
    headerText.includes("<script")
  ) {
    return {
      valid: false,
      error: "Format SVG atau berkas berbasis skrip XML/HTML tidak diizinkan demi alasan keamanan.",
    };
  }

  // Deteksi executable Windows (MZ) atau Linux ELF
  if (
    (buffer[0] === 0x4d && buffer[1] === 0x5a) || // MZ header
    (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) // ELF
  ) {
    return {
      valid: false,
      error: "Berkas biner yang dapat dieksekusi dilarang keras.",
    };
  }

  return {
    valid: false,
    error: "Tipe berkas tidak dikenali atau tidak didukung. Hanya JPEG, PNG, dan WebP yang diizinkan.",
  };
}
