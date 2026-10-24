# Appointment Calendar

Dokumentasi implementasi kalender janji temu operasional (*Appointment Calendar*) pada aplikasi **TampilKit Booking (PawCare Grooming)**.

---

## 1. Ikhtisar Kalender

Kalender janji temu (`/dashboard/calendar`) dirancang khusus untuk memvisualisasikan seluruh jadwal pemesanan grooming dan pemblokiran waktu stasiun kerja dalam satu tampilan interaktif yang responsif:

- **Tiga Sudut Pandang (Views)**:
  - **Tampilan Harian (Day View)**: Menampilkan timeline 24 jam dengan interval 30 menit, menyorot jam operasional aktif toko, rentang waktu istirahat (*breaks*), kartu janji temu berdasarkan warna status, dan blokir waktu bertema garis diagonal (*striped pattern*).
  - **Tampilan Mingguan (Week View)**: Menampilkan perbandingan 7 hari kerja (Senin sampai Minggu) berdampingan untuk memantau kepadatan jadwal salon sepanjang minggu berjalan.
  - **Tampilan Bulanan (Month View)**: Grid kalender 35-42 sel bulanan yang memuat ringkasan jumlah janji temu per hari serta daftar preview pemesanan utama.
- **Navigasi Cepat**: Tombol *Hari Ini (Today)*, panah navigasi *Sebelumnya / Berikutnya*, serta selektor tanggal untuk melompat langsung ke hari tertentu.
- **Indikator Status Terstandardisasi**: Warna kartu janji temu langsung mencerminkan status booking:
  - Kuning: `PENDING`
  - Biru: `CONFIRMED`
  - Indigo / Ungu: `CHECKED_IN`
  - Oranye / Amber: `IN_PROGRESS`
  - Hijau: `COMPLETED`
  - Merah: `CANCELLED`
  - Abu-abu / Muted: `NO_SHOW`

---

## 2. Integrasi Blokir Waktu (Blocked Times)

Kalender tidak hanya merender janji temu pelanggan, tetapi juga memvisualisasikan `ResourceBlock` aktif:
- Diberi penanda visual khusus menggunakan kelas CSS `.stripe-blocked-time` dengan garis diagonal abu-abu transparan.
- Menampilkan alasan pemblokiran (misalnya: *Sterilisasi Meja Grooming*, *Maintenance Mesin Pengering*, atau *Briefing Staf*).
- Menjamin staf admin langsung mengetahui bahwa kapasitas stasiun grooming sedang dinonaktifkan untuk slot tersebut.

---

## 3. Kontrak API Kalender

Endpoint: `GET /api/admin/calendar/events`

### Query Parameters:
- `start`: Tanggal awal rentang kalender (format `YYYY-MM-DD`).
- `end`: Tanggal akhir rentang kalender (format `YYYY-MM-DD`).

### Contoh Respons:
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "clx...",
        "bookingCode": "GRM-20261023-A1B2",
        "startAt": "2026-10-23T02:00:00.000Z",
        "endAt": "2026-10-23T03:30:00.000Z",
        "status": "CONFIRMED",
        "serviceName": "Full Grooming Premium",
        "customerName": "Budi Santoso",
        "petName": "Milo",
        "petType": "DOG"
      }
    ],
    "blockedTimes": [
      {
        "id": "blk...",
        "startAt": "2026-10-23T05:00:00.000Z",
        "endAt": "2026-10-23T06:00:00.000Z",
        "reason": "Pembersihan Rutin Stasiun Grooming"
      }
    ]
  }
}
```

---

## 4. Aksesibilitas & Responsivitas

- Kompatibel dengan kontrol keyboard dan screen reader.
- Pada layar mobile/tablet, kalender menyediakan mode gulir horizontal atau daftar agenda terpadu agar staf tetap dapat memeriksa jadwal dengan nyaman.
