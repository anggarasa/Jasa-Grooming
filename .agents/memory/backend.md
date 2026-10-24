# Memori: backend

> Pelajaran nyata dari proyek ini, ditulis oleh `curator`. Format: `- [YYYY-MM-DD] [Kategori] Pelajaran & cara mencegahnya.` (maks ±25 kata/entry, ±20 entry).

- [2026-10-23] [Next.js] Mock modul server-only di runner testing dan hindari export dynamic force-dynamic bila cacheComponents aktif.
- [2026-10-23] [Storage] Tolak tegas path traversal (.., null byte), validasi kepemilikan tenant sebelum hapus objek, dan sanitasi buffer serta objectKey.
- [2026-10-23] [API] Selalu bungkus parsing request JSON dengan try-catch agar payload kosong atau rusak merespons HTTP 400.
- [2026-10-23] [Keamanan] Evaluasi ulang status token di dalam transaksi database atomik untuk mencegah race condition pada token refresh simultan.
- [2026-10-23] [Validasi] Gunakan .min(1) untuk field wajib Zod dan batasi nilai numerik serta keunikan elemen array via refine.
- [2026-10-23] [Keamanan] Serialisasi payload JSON inline wajib meng-escape tag HTML dan pemisah unicode guna mencegah celah script breakout XSS.
- [2026-10-23] [Konkurensi] Gunakan advisory lock hashing 32-bit, urutkan kunci rekursif pada fingerprint, dan upsert idempotensi dalam transaksi.
- [2026-10-23] [Error Handling] Ekstrak statusCode dan error code dari custom domain error di handler global agar respons status HTTP selalu konsisten.
- [2026-10-23] [Integrasi Pihak Ketiga] Filter ketat payload sinkronisasi dari data privat dan gunakan updateMany idempoten saat mutasi webhook konkuren.
- [2026-10-23] [Keamanan] Gunakan perbandingan waktu-konstan pada verifikasi signature webhook dan evaluasi ulang status entitas di dalam transaksi ber-lock.
- [2026-10-23] [Database] Jangan catat status error di dalam transaksi yang melempar exception; perbarui status di luar transaksi atau blok finally.
- [2026-10-23] [Integrasi Pihak Ketiga] Lakukan auto-recovery pembaruan access token menggunakan refresh token saat token kosong atau kedaluwarsa sebelum melempar error.
- [2026-10-23] [Konfigurasi Lingkungan] Muat berkas env lokal sebelum env utama agar server dan script mandiri selalu membaca konfigurasi override lokal.
- [2026-10-23] [Antrean Job] Picu eksekusi sinkronisasi langsung pada endpoint retry pekerjaan agar pemrosesan ulang berjalan seketika tanpa menunggu daemon worker.
