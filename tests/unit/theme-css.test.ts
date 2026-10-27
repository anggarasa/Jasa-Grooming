import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Penjaga tema (src/app/globals.css). Komentar dibuang dulu agar kata di komentar
 * tidak dianggap aturan.
 */
const raw = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
const css = raw.replace(/\/\*[\s\S]*?\*\//g, "");

const adminBlock = (() => {
  const start = css.indexOf(".theme-admin {");
  expect(start).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(start, i + 1);
    }
  }
  return css.slice(start);
})();

describe("varian dark:", () => {
  it("hanya aktif di bawah kelas .dark, bukan mengikuti tema gelap OS", () => {
    expect(css).toMatch(/@custom-variant\s+dark\s*\(&:where\(\.dark,\s*\.dark \*\)\)/);
  });

  it("tidak ada aturan @media (prefers-color-scheme) yang menggelapkan sebagian halaman", () => {
    expect(css).not.toMatch(/prefers-color-scheme/);
  });
});

describe("tema backoffice (.theme-admin)", () => {
  const token = (name: string) => adminBlock.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim();

  it("memakai primary hijau merek yang sama dengan landing page", () => {
    expect(token("--primary")).toBe("#1B5C49");
    expect(token("--accent")).toBe("#1B5C49");
    expect(token("--ring")).toBe("#1B5C49");
  });

  it("kanvas abu-kehijauan terpisah dari --background (yang tetap putih untuk komponen di dalam kartu)", () => {
    expect(token("--admin-canvas")).toBe("#EDF1EE");
    expect(token("--background")).toBe("#FFFFFF");
    expect(token("--sidebar")).toBe(token("--admin-canvas"));
  });

  it("item sidebar aktif berupa pil putih", () => {
    expect(token("--sidebar-active")).toBe("#FFFFFF");
  });

  it("merah destruktif sama dengan landing page", () => {
    expect(token("--destructive")).toBe("#B3261E");
  });

  it("token grafik dan tabel tersedia dan hanya turunan hijau/abu-kehijauan", () => {
    for (const name of ["--chart-bar-top", "--chart-bar-bottom", "--chart-bar-strong", "--chart-line", "--chart-grid", "--chart-tick-off", "--table-header-bg", "--table-row-hover", "--table-border"]) {
      expect(token(name), name).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("sudut kartu & panel adalah token (18px / 24px)", () => {
    expect(token("--radius-admin-card")).toBe("18px");
    expect(token("--radius-admin-panel")).toBe("24px");
  });
});

describe("fokus kolom ketik admin", () => {
  it("kolom 'telanjang' (.admin-bare) dikecualikan dari cincin fokus global", () => {
    expect(css).toMatch(/:not\(\.admin-bare\):focus-visible/);
  });
});
