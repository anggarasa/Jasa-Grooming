import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";
import { prisma } from "@/lib/prisma";
import * as minioLib from "@/lib/minio";
import { NextRequest } from "next/server";
import { env } from "@/config/env";

describe("Health Check API Route (GET /api/health)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("mengembalikan HTTP 200 dan status healthy ketika database dan storage sehat", async () => {
    vi.spyOn(prisma, "$queryRaw").mockResolvedValue(
      [{ 1: 1 }] as unknown as [Record<string, unknown>]
    );
    vi.spyOn(minioLib, "checkStorageHealth").mockResolvedValue({
      healthy: true,
      bucket: "tampilkit-booking",
    });
    vi.spyOn(prisma.calendarConnection, "findFirst").mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.application).toBe("tampilkit-booking");
    expect(data.version).toBe("0.1.0");
    expect(data.checks.database).toBe("healthy");
    expect(data.checks.storage).toBe("healthy");
    expect(data.services.database).toBe("healthy");
    expect(data.services.storage).toBe("healthy");
    expect(data.metrics).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });

  it("mengembalikan HTTP 503 dan status degraded ketika database gagal", async () => {
    vi.spyOn(prisma, "$queryRaw").mockRejectedValue(
      new Error("Database offline")
    );
    vi.spyOn(minioLib, "checkStorageHealth").mockResolvedValue({
      healthy: true,
      bucket: "tampilkit-booking",
    });
    vi.spyOn(prisma.calendarConnection, "findFirst").mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("degraded");
    expect(data.checks.database).toBe("unhealthy");
    expect(data.checks.storage).toBe("healthy");
  });

  it("mengembalikan HTTP 503 dan status degraded ketika storage gagal", async () => {
    vi.spyOn(prisma, "$queryRaw").mockResolvedValue(
      [{ 1: 1 }] as unknown as [Record<string, unknown>]
    );
    vi.spyOn(minioLib, "checkStorageHealth").mockResolvedValue({
      healthy: false,
      bucket: "tampilkit-booking",
      message: "MinIO down",
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("degraded");
    expect(data.checks.database).toBe("healthy");
    expect(data.checks.storage).toBe("unhealthy");
  });

  it("semantik liveness: mengembalikan HTTP 200 dan status live untuk probe liveness", async () => {
    const req = new NextRequest("http://localhost:3000/api/health?probe=live");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("live");
    expect(data.timestamp).toBeDefined();
  });

  it("semantik readiness: mengembalikan status ready bila DB siap dan not_ready bila DB gagal", async () => {
    vi.spyOn(prisma, "$queryRaw").mockResolvedValue(
      [{ 1: 1 }] as unknown as [Record<string, unknown>]
    );
    const readyReq = new NextRequest("http://localhost:3000/api/health?probe=ready");
    const readyRes = await GET(readyReq);
    const readyData = await readyRes.json();

    expect(readyRes.status).toBe(200);
    expect(readyData.status).toBe("ready");

    vi.spyOn(prisma, "$queryRaw").mockRejectedValue(new Error("DB not ready"));
    const notReadyRes = await GET(readyReq);
    const notReadyData = await notReadyRes.json();

    expect(notReadyRes.status).toBe(503);
    expect(notReadyData.status).toBe("not_ready");
  });

  it("semantik degraded: mengembalikan HTTP 200 degraded bila hanya antrean sync bermasalah", async () => {
    const origSync = env.GOOGLE_CALENDAR_SYNC_ENABLED;
    (env as { GOOGLE_CALENDAR_SYNC_ENABLED: boolean }).GOOGLE_CALENDAR_SYNC_ENABLED = true;
    try {
      vi.spyOn(prisma, "$queryRaw").mockResolvedValue(
        [{ 1: 1 }] as unknown as [Record<string, unknown>]
      );
      vi.spyOn(minioLib, "checkStorageHealth").mockResolvedValue({
        healthy: true,
        bucket: "tampilkit-booking",
      });
      vi.spyOn(prisma.calendarConnection, "findFirst").mockResolvedValue({
        id: "conn-123",
        lastErrorAt: new Date(),
        status: "ACTIVE",
      } as unknown as Awaited<ReturnType<typeof prisma.calendarConnection.findFirst>>);
      vi.spyOn(prisma.calendarSyncJob, "count").mockResolvedValue(10); // > 5 failed

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("degraded");
      expect(data.checks.googleSync).toBe("degraded");
    } finally {
      (env as { GOOGLE_CALENDAR_SYNC_ENABLED: boolean }).GOOGLE_CALENDAR_SYNC_ENABLED = origSync;
    }
  });
});
