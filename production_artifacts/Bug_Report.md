# Laporan Perbaikan Bug: Kredensial Google OAuth & Antrean Sinkronisasi Google Calendar

- **Gejala**:
  1. Halaman pemantauan Google Calendar (`/dashboard/integrations/google-calendar`) menampilkan outbox job `#E642LD` (`cmvl7ndij0029um5wh7e642ld`) berstatus `Gagal (Retrying)` (1/5 attempts) atau `DEAD_LETTER` dengan pesan error: `Kredensial Google OAuth (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) belum dikonfigurasikan.`
  2. Klik tombol "Coba Lagi" pada antrean sinkronisasi tidak memproses job secara seketika.
  3. Konfigurasi kredensial Google pada `.env.local` tidak termuat secara otomatis ke runtime worker/scripts jika proses server lama belum dimuat ulang.
  4. Pengujian unit Google Calendar sebelumnya tidak terisolasi sehingga menimpa/menghapus record koneksi milik bisnis utama di database.

- **Root Cause**:
  1. **Runtime Env Loading**: `src/config/env.ts` hanya memuat `.env` saat `!process.env.DATABASE_URL`, dan tidak memuat `.env.local`. Akibatnya saat proses Next.js atau worker berjalan secara mandiri, variabel kredensial Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) yang disimpan di `.env.local` tidak terbaca. Selain itu, proses Next.js pada port 3000 dijalankan sebelum pengguna selesai mengisi `.env.local`, sehingga server yang berjalan menyimpan variabel environment kosong dalam memori prosesnya.
  2. **Endpoint Retry Sync**: `src/app/api/integrations/google/sync-jobs/[id]/retry/route.ts` hanya mengatur status job ke `PENDING` di database tanpa langsung memicu `executeSyncJob(job.id)`. Jika daemon worker tidak dijalankan di terminal terpisah, job tetap berada dalam status menunggu.
  3. **Test Data Contamination**: File pengujian unit & integrasi (`tests/unit/google-calendar/google-oauth.test.ts`, `tests/integration/google-calendar/outbox-worker.test.ts`, `conflicts-disconnect.test.ts`, dan `webhook-freebusy.test.ts`) menggunakan `prisma.business.findFirst()` langsung terhadap bisnis utama (PawCare Grooming), sehingga eksekusi pengujian mereset dan mengosongkan token kredensial asli pengguna.

- **File Diubah**:
  1. `src/config/env.ts`: Memuat `.env.local` dan `.env` secara sekuensial melalui `process.loadEnvFile` di Node.js runtime agar variabel lokal selalu tersedia di server, worker, dan standalone scripts.
  2. `src/app/api/integrations/google/sync-jobs/[id]/retry/route.ts`: Menambahkan eksekusi seketika (`executeSyncJob`) saat admin menekan tombol "Coba Lagi" sehingga pemrosesan ulang berlangsung instan dan responsif.
  3. `src/lib/minio.ts`: Menambahkan batasan timeout 2 detik (`Promise.race`) pada `checkStorageHealth()` agar pemeriksaan kesehatan sistem tidak hang ketika MinIO storage tidak merespons.
  4. `tests/unit/google-calendar/google-oauth.test.ts`, `tests/integration/google-calendar/outbox-worker.test.ts`, `tests/integration/google-calendar/conflicts-disconnect.test.ts`, `tests/integration/google-calendar/webhook-freebusy.test.ts`: Mengisolasi data pengujian menggunakan dedicated fixture business (`test-fixture-biz-*`) dan membersihkannya pada `afterAll` agar tidak menyentuh data bisnis utama.

- **Cara Verifikasi**:
  1. Server Next.js direstart di port 3000 (`npm run dev`) dan berhasil memuat `GOOGLE_CLIENT_ID` serta `GOOGLE_CLIENT_SECRET` dari `.env.local`.
  2. Endpoint `/api/health?type=liveness` dan `/api/health?type=readiness` merespons `200 OK` secara instan.
  3. `npm run typecheck` (`tsc --noEmit`) lolos 100% tanpa error.
  4. `npm run lint` (`eslint`) lolos 0 error.
  5. Pengujian Google Calendar (`vitest run tests/unit/google-calendar/google-oauth.test.ts tests/integration/google-calendar/outbox-worker.test.ts tests/integration/google-calendar/conflicts-disconnect.test.ts tests/integration/google-calendar/webhook-freebusy.test.ts`) lolos 18/18 tests tanpa mencemari data bisnis utama.
