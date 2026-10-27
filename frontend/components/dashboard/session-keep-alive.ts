"use client";

import * as React from "react";

/*
 * Menjaga sesi admin tetap hidup selama dashboard terbuka.
 *
 * Masalah: cookie akses hanya berlaku 15 menit, dan sebelumnya tidak ada kode yang
 * memanggil /api/auth/refresh, sehingga admin terlempar ke /login tiap 15 menit
 * meskipun token pembaruan (7 hari) masih sah.
 *
 * Solusi ini HANYA memanggil endpoint yang sudah ada. Masa berlaku token, rotasi,
 * deteksi pemakaian ulang, dan batas mutlak sesi 7 hari tidak diubah.
 *
 * Keamanan rotasi: server mencabut seluruh sesi bila token pembaruan lama dipakai
 * lebih dari 30 detik setelah diganti. Selain itu, bila dua permintaan pembaruan
 * tiba hampir bersamaan, server menjawab permintaan kedua dengan token LAMA (masa
 * toleransi 30 detik) — cookie bisa kembali ke token lama dan 12 menit kemudian sesi
 * dicabut. Jadi permintaan ganda harus benar-benar dicegah:
 *  - satu tab saja yang memperbarui pada satu waktu (Web Locks);
 *  - waktu pembaruan terakhir dibagi antar-tab lewat localStorage DAN BroadcastChannel
 *    (Firefox tidak langsung menyebarkan isi localStorage ke tab lain);
 *  - kunci ditahan sebentar setelah berhasil agar kabar itu sampai sebelum tab lain
 *    memeriksa ulang;
 *  - dalam satu tab, permintaan yang sedang berjalan tidak digandakan;
 *  - `keepalive` agar cookie baru tetap tersimpan walau halaman sedang dimuat ulang.
 * Bila pembaruan gagal, tidak ada yang diubah: perilaku lama berlaku (navigasi
 * berikutnya mengarah ke /login).
 */

export const AUTH_REFRESH_STAMP_KEY = "pawcare:auth-refreshed-at";
/** Cookie akses berlaku 15 menit; perbarui setelah 12 menit agar tersisa jeda 3 menit. */
export const AUTH_REFRESH_AFTER_MS = 12 * 60 * 1000;
const CHECK_EVERY_MS = 60 * 1000;
const LOCK_NAME = "pawcare-auth-refresh";
const CHANNEL_NAME = "pawcare-auth";
/** Lama kunci ditahan setelah berhasil, agar kabar sampai ke tab lain lebih dulu. */
const HOLD_AFTER_SUCCESS_MS = 1500;

export type RefreshOutcome = "skipped" | "refreshed" | "failed";

interface KeepAliveDeps {
  now?: () => number;
  fetchImpl?: typeof fetch;
  storage?: Pick<Storage, "getItem" | "setItem"> | null;
  locks?: { request: (name: string, cb: () => Promise<RefreshOutcome>) => Promise<RefreshOutcome> } | null;
  channel?: Pick<BroadcastChannel, "postMessage"> | null;
  holdMs?: number;
}

/** Waktu pembaruan terakhir yang diketahui tab ini (dari dirinya sendiri atau kabar tab lain). */
let lastKnownRefresh = 0;

/** Dipanggil saat tab lain mengabarkan pembaruan (BroadcastChannel / event storage). */
export function noteRefreshedElsewhere(at: number) {
  if (Number.isFinite(at) && at > lastKnownRefresh) lastKnownRefresh = at;
}

/** Hanya untuk tes. */
export function __resetKeepAliveForTests() {
  lastKnownRefresh = 0;
  inFlight = null;
}

function readStamp(storage: KeepAliveDeps["storage"]): number {
  try {
    return Number(storage?.getItem(AUTH_REFRESH_STAMP_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeStamp(storage: KeepAliveDeps["storage"], value: number) {
  try {
    storage?.setItem(AUTH_REFRESH_STAMP_KEY, String(value));
  } catch {
    // Penyimpanan diblokir (mode privat, dsb.): tetap jalan, hanya tanpa koordinasi antar-tab.
  }
}

/** Belum waktunya? Catatan waktu "di masa depan" (jam perangkat dimundurkan) dianggap sudah jatuh tempo. */
function isFresh(now: number, stamp: number): boolean {
  const age = now - stamp;
  return age >= 0 && age < AUTH_REFRESH_AFTER_MS;
}

function defaultStorage(): KeepAliveDeps["storage"] {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function defaultLocks(): KeepAliveDeps["locks"] {
  if (typeof navigator === "undefined") return null;
  const locks = (navigator as Navigator & { locks?: KeepAliveDeps["locks"] }).locks;
  return locks && typeof locks.request === "function" ? locks : null;
}

let inFlight: Promise<RefreshOutcome> | null = null;
/** Kanal kabar antar-tab; dibuka oleh useSessionKeepAlive. */
let sharedChannel: BroadcastChannel | null = null;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Perbarui sesi bila pembaruan terakhir (di tab mana pun) sudah ≥ 12 menit lalu. */
export function refreshSessionIfDue(deps: KeepAliveDeps = {}): Promise<RefreshOutcome> {
  if (inFlight) return inFlight;

  const now = deps.now ?? Date.now;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const storage = deps.storage === undefined ? defaultStorage() : deps.storage;
  const locks = deps.locks === undefined ? defaultLocks() : deps.locks;
  const channel = deps.channel === undefined ? sharedChannel : deps.channel;
  const holdMs = deps.holdMs ?? HOLD_AFTER_SUCCESS_MS;
  const latest = () => Math.max(readStamp(storage), lastKnownRefresh);

  if (isFresh(now(), latest())) {
    return Promise.resolve("skipped");
  }

  const run = async (): Promise<RefreshOutcome> => {
    // Periksa ulang di dalam kunci: tab lain mungkin baru saja memperbarui.
    if (isFresh(now(), latest())) return "skipped";
    let res: Response;
    try {
      res = await fetchImpl("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        keepalive: true,
      });
    } catch {
      return "failed"; // jaringan putus: coba lagi pada pemeriksaan berikutnya
    }
    if (!res.ok) return "failed";
    const at = now();
    lastKnownRefresh = at;
    writeStamp(storage, at);
    try {
      channel?.postMessage(at);
    } catch {
      // kanal tertutup: localStorage tetap menjadi cadangan
    }
    if (locks && holdMs > 0) await sleep(holdMs);
    return "refreshed";
  };

  inFlight = (locks ? locks.request(LOCK_NAME, run) : run()).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Dipasang sekali di kerangka dashboard. */
export function useSessionKeepAlive() {
  React.useEffect(() => {
    let stopped = false;
    let failures = 0;

    // Dengarkan kabar pembaruan dari tab lain.
    if (typeof BroadcastChannel !== "undefined") {
      sharedChannel = new BroadcastChannel(CHANNEL_NAME);
      sharedChannel.onmessage = (event: MessageEvent) => noteRefreshedElsewhere(Number(event.data));
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_REFRESH_STAMP_KEY && event.newValue) noteRefreshedElsewhere(Number(event.newValue));
    };
    window.addEventListener("storage", onStorage);

    const check = () => {
      // Setelah 3 kegagalan beruntun (mis. sesi dicabut dari perangkat lain), berhenti:
      // tidak ada gunanya terus memanggil server; navigasi berikutnya menangani sisanya.
      if (stopped || failures >= 3) return;
      void refreshSessionIfDue().then((outcome) => {
        if (outcome === "failed") failures += 1;
        else if (outcome === "refreshed") failures = 0;
      });
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    check();
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    window.addEventListener("online", check);

    return () => {
      stopped = true;
      window.removeEventListener("storage", onStorage);
      sharedChannel?.close();
      sharedChannel = null;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
      window.removeEventListener("online", check);
    };
  }, []);
}
