# Laporan Perbaikan Bug: Token Akses Tidak Tersimpan & Sinkronisasi Google Calendar Error

- **Gejala**: Pengguna menerima pesan "Token akses tidak tersimpan. coba kamu cek apakah masih ada yang kurang di konfigurasinya ketika saya mencoba untuk fitur calender ini selalu saja error." saat menggunakan integrasi Google Calendar dan tombol sinkronisasi.
- **Root Cause**:
  1. `getValidAccessToken` langsung melempar error `Token akses tidak tersimpan.` bila `encryptedAccessToken` kosong, tanpa mengevaluasi `encryptedRefreshToken` untuk mengambil token baru.
  2. Fallback `tokenExpiresAt` pada callback OAuth bernilai `null` jika Google tidak mengirimkan `expiry_date`, menyebabkan token dianggap kedaluwarsa seketika.
  3. Pembaruan status `NEEDS_REAUTH` dilakukan di dalam transaksi Prisma yang di-rollback saat melempar error, sehingga status tidak tersimpan di database dan menyebabkan FreeBusy fail-closed memblokir ketersediaan jadwal.
  4. Endpoint `POST /api/integrations/google/sync` hanya menjalankan pull incremental tanpa memproses antrean outbox pending jobs (`runSyncWorkerCycle`), sehingga sinkronisasi manual tidak mencerminkan reservasi terbaru jika worker terminal tidak berjalan.
  5. Scopes Google Calendar belum menyertakan scope utama `https://www.googleapis.com/auth/calendar`.
- **File Diubah**:
  1. `src/modules/integrations/google/google-oauth.service.ts`: Penambahan scope utama, default 1 jam expiry, automatic token recovery dari refresh token, dan persistensi status `NEEDS_REAUTH` di blok `finally`.
  2. `src/modules/integrations/google/calendar-client.factory.ts`: Exception boundary pada `getBusinessCalendarClient` agar mengembalikan `null` secara aman saat otentikasi gagal.
  3. `src/app/api/integrations/google/sync/route.ts`: Menjalankan pemrosesan antrean outbox secara langsung (`runSyncWorkerCycle(20)`) saat tombol "Sinkronkan Sekarang" ditekan.
  4. `src/app/api/integrations/google/callback/route.ts`: Memproses antrean sinkronisasi awal outbox seketika setelah OAuth sukses.
  5. `tests/unit/google-calendar/google-oauth.test.ts`: Unit test untuk automatic token recovery, URL consent, fail-safe refresh, dan persistensi `NEEDS_REAUTH`.
- **Cara Verifikasi**:
  1. `npx vitest run tests/unit/google-calendar/google-oauth.test.ts` (7/7 tests passed).
  2. `npm run typecheck` (`tsc --noEmit` lolos tanpa error).
  3. `npm run lint` (`eslint` lolos 0 error).
  4. `npm run test` (seluruh 47 file pengujian dan 355 test case lolos 100%).
