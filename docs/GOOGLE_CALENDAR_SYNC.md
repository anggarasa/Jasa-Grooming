# Sinkronisasi Dua Arah & Antrean Outbox Google Calendar

Dokumentasi arsitektur sinkronisasi dua arah (*Bidirectional Sync*), antrean transaksi *outbox pattern*, integrasi Google FreeBusy, dan penanganan webhook push notification pada **TampilKit Booking (PawCare Grooming)**.

---

## 1. Arsitektur Outbox Queue (`CalendarSyncJob`)

Untuk menjamin keandalan tanpa mengandalkan *fire-and-forget promises* pada runtime serverless:

```
[Mutasi Booking di PostgreSQL]
          │
          ▼
[Simpan Rekaman ke CalendarSyncJob (Outbox)]
          │ (Atomic Transaction)
          ▼
[Calendar Worker Process (npm run calendar:worker)]
          │
          ├──> Klaim job atomik dengan lease lock (lockedUntil)
          ├──> Panggil Google Calendar API v3
          ├──> Simpan externalEventId & ETag ke CalendarEventMapping
          └──> Tandai job COMPLETED (atau FAILED dengan exponential backoff)
```

### Operasi yang Didukung:
1. `CREATE`: Membuat event Google saat janji temu dikonfirmasi. Rentang waktu event mencakup durasi layanan ditambah buffer time pembersihan.
2. `RESCHEDULE`: Memperbarui start/end time event Google saat jadwal diubah oleh admin.
3. `CANCEL`: Menghapus managed event dari Google Calendar saat reservasi dibatalkan.
4. `RESOURCE_BLOCK`: Membuat/menghapus event penanda stasiun grooming diblokir manual oleh admin.

---

## 2. Integrasi Google FreeBusy pada Availability Engine

Ketika pelanggan publik membuka halaman reservasi `/booking`:
1. Sistem mengecek status koneksi Google Calendar:
   - Jika terhubung & aktif, sistem mengeksekusi kueri Google FreeBusy API untuk rentang tanggal terkait.
   - Interval sibuk yang bersumber dari event eksternal pribadi admin disimpan secara sementara di `CalendarExternalBusyInterval`.
2. **Eliminasi Duplikasi Kapasitas**:
   - Event yang berkorespondensi dengan reservasi PawCare yang sudah ada di basis data PostgreSQL dieksklusikan dari perhitungan FreeBusy eksternal agar kapasitas tidak terpotong dua kali.
3. **Kebijakan Fail-Closed**:
   - Jika koneksi Google Calendar aktif namun kueri ketersediaan FreeBusy mengalami timeout (melebihi `GOOGLE_CALENDAR_FREEBUSY_TIMEOUT_MS`) atau error jaringan, sistem menerapkan kebijakan *fail-closed* untuk melindungi salon dari potensi double booking eksternal:
   > *"Jadwal sedang tidak dapat diperiksa. Silakan coba beberapa saat lagi."*

---

## 3. Inbound Sync (Webhook & Incremental Sync Token)

1. **Push Notifications**:
   - Google mengirimkan sinyal perubahan ke `POST /api/webhooks/google-calendar`.
   - Webhook memverifikasi header channel, lalu menjadwalkan sinkronisasi inkremental tanpa memproses sinkronisasi berat di dalam siklus webhook.
2. **Incremental Sync Token (`syncToken`)**:
   - Worker menggunakan `syncToken` untuk hanya mengunduh data event yang berubah atau dihapus sejak sinkronisasi terakhir.
   - Nilai cursor `nextSyncToken` disimpan secara persisten di tabel `CalendarSyncState`.
3. **Pemulihan HTTP 410 Gone**:
   - Jika cursor `syncToken` kedaluwarsa di sisi Google (HTTP 410), sistem secara otomatis memicu sinkronisasi penuh terkontrol (*controlled full resync*) untuk membangun ulang data interval sibuk eksternal tanpa menghapus data booking PostgreSQL lokal.
