# Calendar Worker & CLI Commands

Dokumentasi skrip eksekusi worker antrean outbox, sinkronisasi inkremental, pembaruan saluran webhook (*watch renewal*), serta rekonsiliasi data pada **TampilKit Booking (PawCare Grooming)**.

---

## 1. Skrip Eksekusi Worker (`package.json`)

Tersedia perintah npm untuk menjalankan tugas-tugas sinkronisasi di lingkungan pengembangan dan produksi:

```bash
# 1. Menjalankan worker pemroses antrean outbox (long-running process)
npm run calendar:worker

# 2. Menjalankan satu putaran pemrosesan outbox lalu keluar (cron-compatible)
npm run calendar:worker:once

# 3. Memicu sinkronisasi inkremental on-demand
npm run calendar:sync

# 4. Rekonsiliasi berkala event lokal vs Google Calendar
npm run calendar:reconcile

# 5. Memperbarui langganan saluran webhook (watch channels) sebelum kedaluwarsa
npm run calendar:renew-watches
```

---

## 2. Arsitektur Pemrosesan Pekerjaan (Job Processing Lifecycle)

1. **Lease Locking**:
   - Worker mengambil pekerjaan berstatus `PENDING` atau pekerjaan `FAILED` yang telah melewati masa backoff.
   - Kolom `lockedUntil` diisi dengan waktu sewa (*lease duration*, default 60 detik) untuk mencegah eksekusi duplikat oleh proses worker lain.
2. **Exponential Backoff & Jitter**:
   - Jika panggilan API Google mengalami kegagalan sementara (misal HTTP 503 atau 429 Rate Limit), `attemptCount` bertambah dan `nextAttemptAt` dihitung secara eksponensial dengan jitter acak.
3. **Dead-Letter Handling**:
   - Jika pekerjaan gagal hingga batas maksimal (`GOOGLE_CALENDAR_RETRY_MAX_ATTEMPTS`), status pekerjaan dialihkan ke `DEAD_LETTER` dan dapat di-retry secara manual oleh staf admin di dashboard.
4. **Graceful Shutdown**:
   - Worker menangani sinyal `SIGINT` dan `SIGTERM` dengan menyelesaikan job yang sedang berjalan sebelum keluar secara bersih.
