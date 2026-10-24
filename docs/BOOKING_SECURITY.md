# Dokumentasi Keamanan & Akses Tamu Reservasi: Phase 05

Dokumen ini menjelaskan model keamanan data tamu, otorisasi tautan manajemen mandiri, mitigasi kerentanan IDOR, dan perlindungan anti-penyalahgunaan pada **TampilKit Booking**.

---

## 1. Otorisasi Akses Tamu Berbasis Token Ter-hash (*Guest Access Tokens*)

Pelanggan yang memesan tanpa akun (tamu) memerlukan mekanisme aman untuk melihat rincian reservasi mereka tanpa membocorkan data kepada pihak lain:

1. **Token Acak Berentropi Tinggi**:
   - Saat reservasi berhasil dibuat, sistem menghasilkan token acak 32-byte kriptografis aman (`crypto.randomBytes(32).toString("hex")`).
2. **Penyimpanan Token Ter-hash**:
   - Token asli mentah dikirimkan hanya sekali kepada peramban tamu melalui respon konfirmasi dan tautan URL manajemen (`/booking/manage?token=...`).
   - Basis data **hanya menyimpan hash SHA-256** dari token tersebut pada tabel `BookingAccessToken`.
3. **Pencegahan Enumerasi Kode Booking**:
   - Kode booking publik (`GRM-20261026-0001`) **tidak pernah** digunakan sebagai kredensial autentikasi untuk mengakses rincian data pelanggan atau catatan medis hewan peliharaan.
   - Siapa pun yang hanya menebak kode booking tanpa memiliki token acak asli akan ditolak dengan error `FORBIDDEN` / `UNAUTHORIZED` (HTTP 403/401).

---

## 2. Mitigasi Insecure Direct Object Reference (IDOR)

- Endpoint `/api/bookings/manage?token=...` mencocokkan hash token secara ketat terhadap satu record `BookingAccessToken` yang aktif (`revokedAt = null` dan `expiresAt > now`).
- Respon disanitasi dalam bentuk DTO aman:
  - Menyembunyikan seluruh hash token internal, catatan admin rahasia (`internalNotes`), dan ID pelanggan lain.
  - Hanya menampilkan data nama pemesan, nomor kontak, nama anabul, tanggal pengerjaan, dan status reservasi.

---

## 3. Perlindungan terhadap Manipulasi Klien (Client Tampering)

- **Harga & Durasi**: Server menghitung ulang harga dari basis data saat transaksi berjalan. Parameter harga atau durasi yang dikirimkan oleh klien diabaikan secara total.
- **Status Reservasi**: Status awal selalu ditetapkan secara otomatis oleh server (`CONFIRMED` jika auto-confirm aktif) dan tidak dapat dimanipulasi melalui request payload.
- **Validasi Input Ketat**: Schema Zod memvalidasi nomor telepon/WhatsApp, membatasi panjang teks catatan, dan menolak karakter berbahaya.
