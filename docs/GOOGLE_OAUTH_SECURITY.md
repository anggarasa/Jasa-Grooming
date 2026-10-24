# Keamanan Google OAuth & Enkripsi Kredensial

Dokumentasi arsitektur keamanan, perlindungan anti-CSRF, isolasi izin peran (RBAC), serta enkripsi data terotentikasi (*Authenticated Encryption*) untuk integrasi Google Calendar pada **TampilKit Booking (PawCare Grooming)**.

---

## 1. Perlindungan State OAuth (Anti-CSRF & Anti-Replay)

Untuk mencegah serangan *OAuth CSRF*, *Account Mix-Up*, dan *Replay Attack*:
1. Parameter `state` dihasilkan di sisi server saat pemilik mengklik tombol koneksi.
2. `state` memuat informasi:
   - `userId`: ID pengguna pemilik yang sedang login.
   - `timestamp`: Waktu pembuatan state (memiliki masa kedaluwarsa 10 menit).
   - `nonce`: String acak kriptografis 16-byte unik.
3. Payload state ditandatangani menggunakan **HMAC-SHA256** dengan `GOOGLE_OAUTH_STATE_SECRET`.
4. Saat callback `/api/integrations/google/callback` diterima:
   - Sistem memverifikasi kecocokan tanda tangan HMAC.
   - Sistem memastikan state belum kedaluwarsa.
   - Sistem memastikan bahwa akun yang login di sesi browser sama dengan pemilik pembuat state awal.
   - State yang telah digunakan otomatis hangus (*one-time use*).

---

## 2. Enkripsi Kredensial Token di Basis Data (AES-256-GCM)

Token OAuth Google (`access_token` dan `refresh_token`) merupakan data sensitif yang tidak boleh disimpan dalam teks biasa (*plaintext*):

- **Algoritma**: **AES-256-GCM** (*Galois/Counter Mode*).
- **Integritas & Autentikasi**: Menyertakan Authentication Tag 128-bit untuk mencegah manipulasi atau *ciphertext tampering*.
- **Initialization Vector (IV)**: IV 12-byte acak dibuat secara independen untuk setiap operasi enkripsi.
- **Kunci Rahasia**: Diambil dari variabel lingkungan server `GOOGLE_TOKEN_ENCRYPTION_KEY` dan tidak pernah disimpan di dalam PostgreSQL.
- **Sanitasi Respons**: Token terenkripsi maupun plaintext tidak pernah dikembalikan ke client browser atau disertakan dalam respons JSON API.

---

## 3. Pembatasan Hak Akses (RBAC)

1. **Khusus Peran `OWNER`**:
   - Memulai alur otorisasi Google OAuth (`GET /api/integrations/google/connect`).
   - Memilih kalender tujuan (`POST /api/integrations/google/select-calendar`).
   - Memutuskan koneksi Google Calendar (`POST /api/integrations/google/disconnect`).
2. **Peran `ADMIN` & `OWNER`**:
   - Memantau status koneksi & sinkronisasi (`GET /api/integrations/google/status`).
   - Memicu sinkronisasi manual (*on-demand sync*).
   - Memeriksa antrean job outbox dan melakukan retry job gagal.
   - Melihat dan menyelesaikan konflik sinkronisasi jadwal.
3. **Endpoint Webhook Publik (`/api/webhooks/google-calendar`)**:
   - Tidak menggunakan cookie JWT sesi admin.
   - Divalidasi secara ketat berdasarkan header channel Google (`x-goog-channel-id`, `x-goog-resource-id`, `x-goog-channel-token`) terhadap rekaman aktif di tabel `CalendarWebhookChannel`.

---

## 4. Perlindungan Privasi Data Pelanggan

Saat membuat event janji temu di Google Calendar:
- Ringkasan event (*Summary*): `Grooming — {Nama Layanan} — {Kode Booking}`.
- Deskripsi event: Hanya memuat catatan jadwal minimal.
- **Data yang Dikecualikan**: Nomor WhatsApp, alamat email pelanggan, catatan medis sensitif hewan peliharaan, dan catatan internal staf **tidak pernah dikirimkan ke Google Calendar**.
- Metadata internal (seperti ID booking internal dan aggregate version) disimpan pada properti tersembunyi `extendedProperties.private`.
