import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Penjaga keselamatan sistem motion (docs/redesign/motion-system.md §7):
 * semua aturan gerak publik harus berada di dalam `prefers-reduced-motion: no-preference`,
 * tidak ada aturan reduced-motion global (merusak spinner dashboard), dan token tersedia.
 */
const css = readFileSync(join(process.cwd(), "frontend/app/globals.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

interface RuleInfo {
  selector: string;
  ancestors: string[];
}

function collectRules(source: string): RuleInfo[] {
  const rules: RuleInfo[] = [];
  const stack: string[] = [];
  let buf = "";
  for (const ch of source) {
    if (ch === "{") {
      stack.push(buf.trim());
      buf = "";
    } else if (ch === "}") {
      const sel = stack.pop() ?? "";
      if (!sel.startsWith("@")) rules.push({ selector: sel, ancestors: [...stack] });
      buf = "";
    } else if (ch === ";") {
      buf = "";
    } else {
      buf += ch;
    }
  }
  return rules;
}

const rules = collectRules(css);
const motionRules = rules.filter((r) =>
  /(^|[\s,>])(\[data-reveal|\.motion-)/.test(r.selector) &&
  !r.ancestors.some((a) => a.startsWith("@keyframes")),
);

describe("CSS sistem motion", () => {
  it("menemukan aturan motion (penjaga tidak kosong)", () => {
    expect(motionRules.length).toBeGreaterThan(20);
  });

  it("setiap aturan reveal/.motion-* berada di dalam prefers-reduced-motion: no-preference", () => {
    const outside = motionRules.filter(
      (r) => !r.ancestors.some((a) => a.includes("prefers-reduced-motion: no-preference")),
    );
    expect(outside.map((r) => r.selector)).toEqual([]);
  });

  it("tidak ada aturan reduced-motion global yang mematikan animasi (*)", () => {
    const globalKill = rules.filter(
      (r) =>
        r.selector.trim() === "*" &&
        r.ancestors.some((a) => a.includes("prefers-reduced-motion: reduce")),
    );
    expect(globalKill).toEqual([]);
  });

  it("token motion tersedia dan hanya satu easing lembut tanpa overshoot", () => {
    for (const token of [
      "--motion-fast",
      "--motion-base",
      "--motion-reveal",
      "--motion-enter",
      "--motion-image",
      "--motion-stagger",
      "--ease-out-expo",
      "--ease-soft",
    ]) {
      expect(css).toContain(token + ":");
    }
    // Overshoot = nilai y di luar 0..1 pada cubic-bezier.
    const beziers = [...css.matchAll(/cubic-bezier\(([^)]*)\)/g)].map((m) =>
      m[1].split(",").map((n) => parseFloat(n)),
    );
    for (const [, y1, , y2] of beziers) {
      expect(y1).toBeGreaterThanOrEqual(0);
      expect(y1).toBeLessThanOrEqual(1);
      expect(y2).toBeGreaterThanOrEqual(0);
      expect(y2).toBeLessThanOrEqual(1);
    }
  });
});
