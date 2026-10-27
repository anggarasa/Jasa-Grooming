import { describe, it, expect } from "vitest";
import { validateCsrfOrigin } from "@backend/modules/auth/csrf.service";
import { NextRequest } from "next/server";

describe("CSRF Service (validateCsrfOrigin)", () => {
  it("mengizinkan metode aman (GET, HEAD, OPTIONS) tanpa header Origin", () => {
    const req = new NextRequest("http://localhost:3000/api/auth/me", {
      method: "GET",
    });
    const result = validateCsrfOrigin(req);
    expect(result.valid).toBe(true);
  });

  it("menolak request mutasi (POST) jika tidak memiliki Origin maupun Referer", () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
    });
    const result = validateCsrfOrigin(req);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Origin atau Referer wajib ada");
  });

  it("mengizinkan request mutasi jika Origin cocok dengan host aplikasi", () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        host: "localhost:3000",
      },
    });
    const result = validateCsrfOrigin(req);
    expect(result.valid).toBe(true);
  });

  it("menolak request mutasi jika Origin berasal dari domain berbahaya / tidak cocok", () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        origin: "https://evil-attacker.com",
        host: "localhost:3000",
      },
    });
    const result = validateCsrfOrigin(req);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Origin tidak diizinkan");
  });

  it("mengizinkan request mutasi jika fallback Referer cocok dengan host aplikasi", () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        referer: "http://localhost:3000/login",
        host: "localhost:3000",
      },
    });
    const result = validateCsrfOrigin(req);
    expect(result.valid).toBe(true);
  });

  it("menangani x-forwarded-host multi-host (comma separated) dengan mengekstrak host pertama", () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "x-forwarded-host": "localhost:3000, proxy.internal",
      },
    });
    const result = validateCsrfOrigin(req);
    expect(result.valid).toBe(true);
  });
});
