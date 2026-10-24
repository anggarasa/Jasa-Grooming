# QA Findings — Bugfix: Token Akses Tidak Tersimpan & Sinkronisasi Google Calendar

Rendah — Logic — src/modules/integrations/google/google-oauth.service.ts:202 — Pemulihan otomatis access token menggunakan refresh token jika access token belum ada atau kedaluwarsa — Terverifikasi (Lolos).
Rendah — Security — src/modules/integrations/google/google-oauth.service.ts:313 — Persistensi status koneksi NEEDS_REAUTH di blok finally mencegah rollback status error dan menghentikan fail-closed loop jadwal booking — Terverifikasi (Lolos).
Rendah — Logic — src/app/api/integrations/google/sync/route.ts:49 — Pemrosesan antrean outbox secara langsung (runSyncWorkerCycle) pada trigger sinkronisasi manual seketika menyelesaikan jobs pending — Terverifikasi (Lolos).
Rendah — Logic — src/modules/integrations/google/calendar-client.factory.ts:64 — Exception boundary pada getBusinessCalendarClient mengembalikan null secara anggun saat otentikasi gagal tanpa uncaught exception — Terverifikasi (Lolos).
