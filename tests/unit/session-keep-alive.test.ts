import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  refreshSessionIfDue,
  noteRefreshedElsewhere,
  __resetKeepAliveForTests,
  AUTH_REFRESH_AFTER_MS,
  AUTH_REFRESH_STAMP_KEY,
} from "@/components/dashboard/session-keep-alive";

function memoryStorage(initial?: number) {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(AUTH_REFRESH_STAMP_KEY, String(initial));
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v), map };
}
const okFetch = () => vi.fn(async () => new Response("{}", { status: 200 }));
const NOW = 1_800_000_000_000;

describe("refreshSessionIfDue — menjaga sesi admin tetap hidup", () => {
  beforeEach(() => __resetKeepAliveForTests());
  it("memanggil POST /api/auth/refresh bila belum pernah diperbarui, lalu mencatat waktunya", async () => {
    const storage = memoryStorage();
    const fetchImpl = okFetch();
    const out = await refreshSessionIfDue({ now: () => NOW, fetchImpl, storage, locks: null, channel: null, holdMs: 0 });
    expect(out).toBe("refreshed");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith("/api/auth/refresh", expect.objectContaining({ method: "POST", credentials: "same-origin" }));
    expect(storage.map.get(AUTH_REFRESH_STAMP_KEY)).toBe(String(NOW));
  });

  it("tidak memanggil server bila tab lain baru memperbarui (< 12 menit)", async () => {
    const fetchImpl = okFetch();
    const out = await refreshSessionIfDue({ now: () => NOW, fetchImpl, storage: memoryStorage(NOW - AUTH_REFRESH_AFTER_MS + 1000), locks: null, channel: null, holdMs: 0 });
    expect(out).toBe("skipped");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("memperbarui tepat setelah 12 menit — sebelum cookie akses 15 menit habis", async () => {
    expect(AUTH_REFRESH_AFTER_MS).toBeLessThan(15 * 60 * 1000);
    const fetchImpl = okFetch();
    const out = await refreshSessionIfDue({ now: () => NOW, fetchImpl, storage: memoryStorage(NOW - AUTH_REFRESH_AFTER_MS), locks: null, channel: null, holdMs: 0 });
    expect(out).toBe("refreshed");
  });

  it("catatan waktu di masa depan (jam dimundurkan) dianggap jatuh tempo", async () => {
    const fetchImpl = okFetch();
    const out = await refreshSessionIfDue({ now: () => NOW, fetchImpl, storage: memoryStorage(NOW + 60 * 60 * 1000), locks: null, channel: null, holdMs: 0 });
    expect(out).toBe("refreshed");
  });

  it("respons gagal (401/429) tidak mencatat waktu, sehingga dicoba lagi nanti", async () => {
    const storage = memoryStorage();
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 401 }));
    expect(await refreshSessionIfDue({ now: () => NOW, fetchImpl, storage, locks: null, channel: null, holdMs: 0 })).toBe("failed");
    expect(storage.map.has(AUTH_REFRESH_STAMP_KEY)).toBe(false);
  });

  it("jaringan putus tidak melempar galat", async () => {
    const fetchImpl = vi.fn(async () => { throw new TypeError("offline"); });
    await expect(refreshSessionIfDue({ now: () => NOW, fetchImpl, storage: memoryStorage(), locks: null, channel: null, holdMs: 0 })).resolves.toBe("failed");
  });

  it("pemanggilan bersamaan dalam satu tab hanya mengirim SATU permintaan (rotasi token aman)", async () => {
    let release!: () => void;
    const fetchImpl = vi.fn(() => new Promise<Response>((r) => { release = () => r(new Response("{}", { status: 200 })); }));
    const deps = { now: () => NOW, fetchImpl, storage: memoryStorage(), locks: null, channel: null, holdMs: 0 };
    const a = refreshSessionIfDue(deps);
    const b = refreshSessionIfDue(deps);
    release();
    expect(await a).toBe("refreshed");
    expect(await b).toBe("refreshed");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("memakai kunci antar-tab dan memeriksa ulang di dalamnya (tab lain sudah memperbarui → lewati)", async () => {
    const storage = memoryStorage();
    const fetchImpl = okFetch();
    const locks = {
      request: vi.fn(async (_name: string, cb: () => Promise<"skipped" | "refreshed" | "failed">) => {
        storage.setItem(AUTH_REFRESH_STAMP_KEY, String(NOW)); // tab lain selesai lebih dulu
        return cb();
      }),
    };
    expect(await refreshSessionIfDue({ now: () => NOW, fetchImpl, storage, locks, channel: null, holdMs: 0 })).toBe("skipped");
    expect(locks.request).toHaveBeenCalledWith("pawcare-auth-refresh", expect.any(Function));
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("memakai keepalive agar cookie baru tetap tersimpan walau halaman dimuat ulang", async () => {
    const fetchImpl = okFetch();
    await refreshSessionIfDue({ now: () => NOW, fetchImpl, storage: memoryStorage(), locks: null, channel: null, holdMs: 0 });
    expect(fetchImpl).toHaveBeenCalledWith("/api/auth/refresh", expect.objectContaining({ keepalive: true }));
  });

  it("mengabarkan waktu pembaruan ke tab lain lewat BroadcastChannel", async () => {
    const channel = { postMessage: vi.fn() };
    await refreshSessionIfDue({ now: () => NOW, fetchImpl: okFetch(), storage: memoryStorage(), locks: null, channel, holdMs: 0 });
    expect(channel.postMessage).toHaveBeenCalledWith(NOW);
  });

  it("kabar dari tab lain cukup untuk melewati pembaruan, walau localStorage belum tersinkron (kasus Firefox)", async () => {
    noteRefreshedElsewhere(NOW - 1000);
    const fetchImpl = okFetch();
    const out = await refreshSessionIfDue({ now: () => NOW, fetchImpl, storage: memoryStorage(0), locks: null, channel: null, holdMs: 0 });
    expect(out).toBe("skipped");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("kabar yang tiba saat menunggu kunci membuat tab ini membatalkan permintaannya", async () => {
    const fetchImpl = okFetch();
    const locks = { request: vi.fn(async (_n: string, cb: () => Promise<"skipped" | "refreshed" | "failed">) => { noteRefreshedElsewhere(NOW); return cb(); }) };
    expect(await refreshSessionIfDue({ now: () => NOW, fetchImpl, storage: memoryStorage(), locks, channel: null, holdMs: 0 })).toBe("skipped");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("menahan kunci sebentar setelah berhasil, agar kabar sampai sebelum tab lain memeriksa ulang", async () => {
    let released = 0;
    const locks = { request: async (_n: string, cb: () => Promise<"skipped" | "refreshed" | "failed">) => { const r = await cb(); released = Date.now(); return r; } };
    const start = Date.now();
    await refreshSessionIfDue({ fetchImpl: okFetch(), storage: memoryStorage(), locks, channel: null, holdMs: 60 });
    expect(released - start).toBeGreaterThanOrEqual(55);
  });
});
