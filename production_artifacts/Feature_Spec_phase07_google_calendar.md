# Spesifikasi Fitur: Phase 07 — Google Calendar OAuth, FreeBusy & Bidirectional Synchronization

## 1. Ringkasan Eksekutif & Tujuan Bisnis
- Mengintegrasikan TampilKit Booking (PawCare Grooming) secara dua arah (bidirectional) dengan Google Calendar via OAuth 2.0 PKCE dan Google Calendar API v3.
- Tujuan: Menyelaraskan reservasi & time-blocking ke kalender pengelola, mengeliminasi overbooking via fail-closed FreeBusy engine, serta menyinkronkan perubahan jadwal eksternal secara aman dan andal.

## 2. User Stories & Kebutuhan
- **User Stories**:
  - Sebagai Owner, saya dapat menghubungkan akun Google, memilih kalender utama, memantau status sinkronisasi, dan memutuskan koneksi secara aman.
  - Sebagai Pengelola/Staff, setiap booking dan pemblokiran waktu toko otomatis muncul di Google Calendar saya, dan jadwal eksternal di Google Calendar otomatis memblokir slot booking toko.
  - Sebagai Pelanggan, saya hanya dapat memesan slot waktu yang benar-benar luang setelah diverifikasi terhadap Google Calendar FreeBusy.
- **Kebutuhan Fungsional**:
  - OAuth 2.0 PKCE & State (OWNER only, offline access, auto-refresh, token terenkripsi AES-256-GCM via `GOOGLE_TOKEN_ENCRYPTION_KEY`).
  - Outbound Sync: Mutasi booking (create, reschedule, cancel) & ResourceBlock masuk ke outbox queue `CalendarSyncJob` untuk diproses durable worker ke Google Calendar.
  - FreeBusy Engine: Integrasi kueri Google FreeBusy pada Availability Engine publik; jika gagal/timeout (`GOOGLE_CALENDAR_FREEBUSY_TIMEOUT_MS`), terapkan fail-closed policy (slot dianggap busy).
  - Inbound Sync: Webhook push notification listener (`/api/webhooks/google-calendar`), incremental sync via `syncToken` (recovery jika HTTP 410 cursor expired), pemetaan `CalendarExternalBusyInterval`.
  - Conflict Resolution: Deteksi bentrok jadwal lokal vs Google ke `CalendarSyncConflict` dengan antarmuka resolusi manual admin.
  - Settings & Monitoring UI: Halaman integrasi di `/dashboard/settings/integrations` & monitoring sync di `/dashboard/integrations/google-calendar`.
  - Graceful Disconnect: Pencabutan token OAuth Google, unregister webhook channel, penghapusan aman kredensial terenkripsi.
- **Kebutuhan Non-Fungsional**: Enkripsi AES-256-GCM, non-blocking durable PostgreSQL outbox worker, timeout FreeBusy agresif (< 2000ms), isolasi per-business.

## 3. Tech Stack & Kebutuhan Layer
- Next.js 16 (App Router), React 19, TypeScript (strict), PostgreSQL, Prisma ORM, googleapis, google-auth-library, Node.js crypto, Tailwind CSS v4, shadcn/ui, Lucide Icons, Zod.
- `Butuh: Backend=ya, Frontend Web=ya, Mobile=tidak, Perubahan UI=ya`

## 4. Lokasi Kode & Struktur Folder
- `prisma/`: Model `CalendarConnection`, `CalendarEventMapping`, `CalendarSyncState`, `CalendarWebhookChannel`, `CalendarExternalBusyInterval`, `CalendarSyncJob`, `CalendarSyncConflict`.
- `src/lib/google/`: `oauth-client.ts`, `calendar-client.ts`, `encryption.ts`, `freebusy.ts`.
- `src/modules/calendar-sync/`: `outbox.service.ts`, `sync.service.ts`, `webhook.service.ts`, `conflict.service.ts`, `disconnect.service.ts`.
- `src/app/api/integrations/google/`: `auth/route.ts`, `callback/route.ts`, `calendars/route.ts`, `disconnect/route.ts`.
- `src/app/api/webhooks/google-calendar/route.ts` & `src/app/api/admin/integrations/google-calendar/`: `status/route.ts`, `sync/route.ts`, `conflicts/route.ts`.
- `src/app/dashboard/`: `settings/integrations/page.tsx`, `integrations/google-calendar/page.tsx`, komponen status, antrean outbox & resolver konflik.
- `src/scripts/`: `calendar-worker.ts`, `calendar-sync.ts`, `calendar-reconcile.ts`, `renew-watches.ts`.
- `tests/`: Unit & integration tests untuk enkripsi, OAuth flow, FreeBusy fail-closed, outbox worker, dan webhook processor.

## 5. Kontrak Data / API Garis Besar
- `GET /api/integrations/google/auth` -> Redirect ke Google OAuth consent screen (state signed JWT/HMAC).
- `GET /api/integrations/google/callback?code=...&state=...` -> Validasi state, pertukaran token, enkripsi AES-256-GCM, simpan `CalendarConnection`.
- `GET /api/integrations/google/calendars` & `POST /api/integrations/google/calendars/select` -> Daftar kalender user & simpan kalender terpilih.
- `POST /api/webhooks/google-calendar` -> Validasi header channel & token hash, rekam sync state, dispatch worker.
- `GET/POST /api/admin/integrations/google-calendar/conflicts` -> Daftar rekonsiliasi bentrok jadwal & aksi resolusi manual (`KEEP_LOCAL` / `OVERWRITE_LOCAL`).
- Alur Data: Mutasi Jadwal Toko -> Outbox `CalendarSyncJob` -> Durable Worker -> Google Calendar API v3; Webhook Push -> Inbound Queue -> Incremental Sync -> `CalendarExternalBusyInterval` -> Availability Engine.

## 6. Brief Desain untuk Designer
- **Mood**: Keamanan enterprise, transparan, tenang, dan dapat diandalkan.
- **UI Elements**: Status card koneksi Google (Connected/Degraded/Disconnected dengan indikator warna), selector dropdown kalender, metrik latensi & outbox queue, tabel konflik dengan visual side-by-side diff (Data Toko vs Data Google) dan dialog konfirmasi resolusi.

## 7. Risiko, Asumsi & Pertanyaan Terbuka
- **Risiko**: Webhook watch Google kedaluwarsa berkala (maks 7 hari) dan batasan kuota rate limit Google API. Mitigasi: Skrip terjadwal `renew-watches` dan retry backoff pada outbox worker.
- **Asumsi**:
  1. Integrasi berlaku untuk single Google account dan single selected calendar per instalasi PawCare Grooming.
  2. Kebijakan fail-closed FreeBusy hanya aktif saat status `CalendarConnection` bernilai `ACTIVE` dan flag `GOOGLE_CALENDAR_SYNC_ENABLED=true`.
  3. Aplikasi tetap berfungsi normal (booking offline/lokal) jika kredensial Google belum dikonfigurasi.
- **Pertanyaan Terbuka**:
  1. Saat admin memutuskan koneksi (disconnect), apakah event PawCare yang telah tersinkron di Google Calendar perlu dihapus massal atau dibiarkan tetap ada sebagai arsip riwayat?
