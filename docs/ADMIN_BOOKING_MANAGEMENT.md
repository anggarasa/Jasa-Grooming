# Admin Booking Management & Dashboard

Dokumentasi arsitektur, fungsionalitas, dan alur kerja manajemen janji temu (appointment management) untuk pemilik bisnis (`OWNER`) dan staf admin (`ADMIN`) pada aplikasi **TampilKit Booking (PawCare Grooming)**.

---

## 1. Ikhtisar & Arsitektur Modul

Modul Admin Booking Dashboard dibangun sebagai perluasan dari *Booking Engine* Phase 05 dengan fokus pada operasional harian salon grooming:

- **Ringkasan Operasional Riil (`/dashboard`)**: KPI cards harian yang dihitung dinamis dari PostgreSQL (tanpa data dummy/proyeksi fiktif), mencakup *Pemesanan Hari Ini*, *Terkonfirmasi*, *Check-in / Sedang Proses*, *Selesai*, *Dibatalkan / No Show*, dan *Estimasi Pendapatan Harian* (dari snapshot harga layanan riil).
- **Master Booking Table (`/dashboard/bookings`)**: Tabel paginasi server dengan filter multi-dimensi (status, layanan, rentang tanggal) serta pencarian real-time (kode booking, nama pelanggan, nomor telepon, nama anabul).
- **Detail Booking & Snapshot Transaksi (`/dashboard/bookings/[id]`)**: Tampilan komprehensif data pemesanan yang melindungi integritas finansial dengan memanfaatkan snapshot harga, durasi, dan nama layanan saat reservasi dibuat. Dilengkapi form catatan internal operasional dan timeline riwayat transisi status serta riwayat penjadwalan ulang (*reschedule*).
- **Walk-in Appointment Form (`/dashboard/bookings/new`)**: Alur pembuatan janji temu langsung di lokasi (*walk-in*) yang menggunakan mesin ketersediaan slot (*slot generator*) dan penguncian transaksi PostgreSQL yang sama dengan alur reservasi publik, dengan tagging sumber `WALK_IN` atau `ADMIN`.
- **Direktori Pelanggan & Hewan (`/dashboard/customers` & `/dashboard/customers/[id]`)**: Repositori profil pemilik anabul, data peliharaan, serta rekapitulasi riwayat reservasi pelanggan.

---

## 2. Hak Akses & Keamanan (RBAC)

Seluruh antarmuka admin di `/dashboard/*` dan API endpoints di `/api/admin/*` dilindungi secara berlapis:
1. **Server Component Authentication (`requireAuth()`)**: Memverifikasi JWT cookie httpOnly (`pawcare_access_token` & rotation `pawcare_refresh_token`). Jika sesi tidak valid, pengguna langsung dialihkan ke `/login`.
2. **Server-side Authorization**: Membatasi peran hanya untuk `OWNER` dan `ADMIN`. Role lain atau token yang tidak valid akan ditolak dengan respons `HTTP 401 Unauthorized` atau `HTTP 403 Forbidden`.
3. **Audit Actor Tracking**: Setiap mutasi status, penjadwalan ulang, pembatalan, pembaruan catatan internal, dan pemblokiran waktu mencatat `actorUserId` pada tabel `BookingAuditLog`, `BookingStatusHistory`, dan `BookingRescheduleHistory`.

---

## 3. Kontrak API Operasional Admin

| Metode | Endpoint | Deskripsi | Otorisasi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard/overview` | Mengambil 6 metrik KPI harian dan daftar janji temu hari ini (Asia/Jakarta) | OWNER, ADMIN |
| `GET` | `/api/admin/bookings` | Mengambil daftar master booking dengan paginasi, sorting, pencarian, dan multi-filter | OWNER, ADMIN |
| `POST` | `/api/admin/bookings` | Membuat reservasi walk-in/admin baru dengan validasi slot & atomic lock | OWNER, ADMIN |
| `POST` | `/api/admin/bookings/walk-in` | Alias rute pembuatan reservasi walk-in | OWNER, ADMIN |
| `GET` | `/api/admin/bookings/[id]` | Mengambil rincian booking lengkap beserta snapshot, histori status, reschedule, dan customer | OWNER, ADMIN |
| `PATCH` | `/api/admin/bookings/[id]` | Memperbarui catatan internal staf (`internalNotes`) | OWNER, ADMIN |
| `PATCH` | `/api/admin/bookings/[id]/status` | Melakukan transisi status reservasi sesuai state machine | OWNER, ADMIN |
| `POST` | `/api/admin/bookings/[id]/reschedule` | Menjadwalkan ulang tanggal/jam reservasi dengan PostgreSQL advisory lock | OWNER, ADMIN |
| `POST` | `/api/admin/bookings/[id]/cancel` | Membatalkan reservasi dengan alasan wajib dan pelepasan kapasitas | OWNER, ADMIN |
| `GET` | `/api/admin/availability` | Mengecek ketersediaan slot admin (mendukung `excludeBookingId`) | OWNER, ADMIN |
| `GET` | `/api/admin/customers` | Mengambil daftar pelanggan dengan paginasi dan pencarian | OWNER, ADMIN |
| `GET` | `/api/admin/customers/[id]` | Mengambil profil lengkap pelanggan, daftar anabul, dan riwayat pesanan | OWNER, ADMIN |

---

## 4. Keamanan Transaksional & Integritas Data

- **Pencegahan Double-Booking**: Operasi walk-in booking dan reschedule menggunakan PostgreSQL transaction lock (`pg_advisory_xact_lock`) pada level resource ID untuk mengeliminasi potensi race condition ketika dua admin atau tamu melakukan aksi bersamaan.
- **Isolasi Timezone**: Seluruh penghitungan tanggal harian menggunakan zona waktu resmi operasional toko (`Asia/Jakarta` / UTC+7).
- **Snapshot Immutability**: Perubahan harga atau durasi master layanan di `/dashboard/services` tidak pernah mengubah nominal harga atau durasi pada pemesanan yang sudah tersimpan.
