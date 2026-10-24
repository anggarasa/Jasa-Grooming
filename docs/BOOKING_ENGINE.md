# Dokumentasi Mesin Reservasi (Booking Engine): Phase 05

Dokumen ini menjelaskan alur kerja pemesanan, snapshot layanan, transaksi basis data, penanganan idempotensi, serta pembuatan kode reservasi unik pada **TampilKit Booking**.

---

## 1. Alur Pemesanan Tamu (Public Guest Booking Flow)

Pemesanan salon grooming hewan dirancang mandiri tanpa mewajibkan registrasi akun terlebih dahulu:
1. **Langkah 1 — Pilih Layanan**: Pelanggan memilih jenis perawatan grooming aktif (dapat di-preselect otomatis dari katalog via URL `/booking?service={id}`).
2. **Langkah 2 — Pilih Tanggal**: Kalender interaktif dinamis yang membatasi tanggal maksimal 30 hari ke depan dan menonaktifkan hari tutup.
3. **Langkah 3 — Pilih Slot Waktu**: Grid waktu dinamis yang dihitung oleh Availability Engine (`/api/availability`), menampilkan slot yang benar-benar tersedia.
4. **Langkah 4 — Data Pemilik**: Nama lengkap, nomor WhatsApp yang dinormalisasi, dan alamat email opsional.
5. **Langkah 5 — Data Hewan**: Nama hewan peliharaan, tipe (Anjing, Kucing, Lainnya), ras, umur, dan catatan kebutuhan khusus.
6. **Langkah 6 — Review & Konfirmasi**: Rangkuman rincian jadwal, perkiraan waktu selesai, total tarif IDR, metode pembayaran di lokasi (*Pay at Location*), dan pengiriman data.

---

## 2. Transaksi Atomik & Snapshot Layanan

Untuk menjamin integritas data transaksi di masa depan, sistem tidak hanya menyimpan ID layanan, melainkan menyimpan **snapshot** nilai pada tabel `Booking`:
- `serviceNameSnapshot`: Nama layanan saat reservasi dibuat.
- `serviceDurationSnapshot`: Durasi menit pengerjaan saat reservasi dibuat.
- `servicePriceSnapshot`: Harga layanan saat reservasi dibuat (`@db.Decimal(12, 2)`).
- `totalPrice`: Total tagihan transaksi (`@db.Decimal(12, 2)`).

> **Penting**: Perubahan nama atau kenaikan tarif layanan di dasbor admin pada masa mendatang tidak akan pernah merusak atau mengubah nilai histori transaksi yang sudah terjadi sebelumnya.

---

## 3. Format Kode Booking Unik

Setiap reservasi menghasilkan kode booking ramah manusia:
`GRM-YYYYMMDD-XXXX`
- `GRM`: Prefix singkatan Grooming.
- `YYYYMMDD`: Tanggal kalender saat reservasi dibuat.
- `XXXX`: 4 digit alfanumerik acak (*collision-resistant*) yang di-generate di server.

---

## 4. Pencegahan Pengiriman Ganda (Idempotency)

- Klien mengirimkan header unik `Idempotency-Key` (UUID).
- Model basis data `BookingIdempotency` menyimpan `keyHash` (SHA-256) dan sidik jari *payload* (`requestFingerprint`).
- Jika pelanggan menekan tombol konfirmasi dua kali berturut-turut atau terjadi *retry* jaringan dengan key yang sama, sistem secara instan mengembalikan data reservasi yang sama tanpa membuat duplikasi di basis data.
- Payload berbeda dengan key yang sama ditolak dengan kode error `DUPLICATE_BOOKING_REQUEST` (HTTP 400).

---

## 5. Ringkasan Endpoint API Reservasi

| Endpoint | Method | Deskripsi | Status |
| :--- | :--- | :--- | :--- |
| `/api/availability` | GET | Mengambil slot waktu tersedia per tanggal & layanan (terintegrasi Google FreeBusy) | 200 / 400 |
| `/api/bookings` | POST | Membuat reservasi tamu baru (berproteksi lock, outbox enqueue & idempotensi) | 201 / 409 |
| `/api/bookings/manage` | GET | Membaca status reservasi tamu via token acak ter-hash | 200 / 403 / 404 |

---

## 6. Integrasi Antrean Outbox Sinkronisasi Google Calendar (Phase 07)

Setiap pembuatan pemesanan baru (`POST /api/bookings` atau Walk-in), penjadwalan ulang (*reschedule*), dan pembatalan (*cancel*) secara otomatis menyisipkan pekerjaan transaksi ke dalam tabel antrean persisten `CalendarSyncJob`:
- **Transactional Consistency**: Penyimpanan intent sinkronisasi dilakukan di dalam blok `$transaction` Prisma yang sama dengan mutasi booking.
- **Worker Execution**: Proses worker independen (`npm run calendar:worker`) mengambil pekerjaan dari outbox, memanggil Google Calendar API v3, dan menyimpan relasi `externalEventId` ke tabel `CalendarEventMapping`.
- **Zero Data Loss**: Jika Google Calendar API sedang offline atau lambat, reservasi pelanggan tetap tersimpan aman di PostgreSQL dan sinkronisasi akan di-retry secara eksponensial.
