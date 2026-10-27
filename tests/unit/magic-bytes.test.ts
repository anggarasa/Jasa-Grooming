import { describe, it, expect } from "vitest";
import { detectImageMagicBytes } from "@backend/modules/storage/magic-bytes";

describe("Validasi Magic Bytes Gambar (detectImageMagicBytes)", () => {
  it("mendeteksi file JPEG yang valid (FF D8 FF)", () => {
    // Header JPEG valid: FF D8 FF E0 00 10 4A 46 49 46 00 01
    const jpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);

    const result = detectImageMagicBytes(jpegBuffer);
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.extension).toBe("jpg");
  });

  it("mendeteksi file PNG yang valid (89 50 4E 47 0D 0A 1A 0A)", () => {
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);

    const result = detectImageMagicBytes(pngBuffer);
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe("image/png");
    expect(result.extension).toBe("png");
  });

  it("mendeteksi file WebP yang valid (RIFF....WEBP)", () => {
    // 'R', 'I', 'F', 'F', [4 bytes size], 'W', 'E', 'B', 'P'
    const webpBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);

    const result = detectImageMagicBytes(webpBuffer);
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe("image/webp");
    expect(result.extension).toBe("webp");
  });

  it("menolak keras file SVG berbasis XML / teks", () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>';
    const svgBuffer = Buffer.from(svgContent, "utf-8");

    const result = detectImageMagicBytes(svgBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("SVG atau berkas berbasis skrip XML/HTML tidak diizinkan");
  });

  it("menolak berkas yang mengandung tag script atau html", () => {
    const htmlBuffer = Buffer.from("<html><script>alert('xss')</script></html>", "utf-8");
    const result = detectImageMagicBytes(htmlBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("SVG atau berkas berbasis skrip XML/HTML tidak diizinkan");
  });

  it("menolak berkas executable Windows (MZ)", () => {
    const mzBuffer = Buffer.from([
      0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00,
    ]);

    const result = detectImageMagicBytes(mzBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Berkas biner yang dapat dieksekusi dilarang");
  });

  it("menolak berkas executable Linux ELF", () => {
    const elfBuffer = Buffer.from([
      0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);

    const result = detectImageMagicBytes(elfBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Berkas biner yang dapat dieksekusi dilarang");
  });

  it("menolak berkas yang terlalu kecil (< 12 byte) atau buffer kosong", () => {
    const smallBuffer = Buffer.from([0xff, 0xd8, 0xff]);
    const result1 = detectImageMagicBytes(smallBuffer);
    expect(result1.valid).toBe(false);

    const emptyBuffer = Buffer.alloc(0);
    const result2 = detectImageMagicBytes(emptyBuffer);
    expect(result2.valid).toBe(false);
  });
});
