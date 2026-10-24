# Laporan Penilaian Keamanan Aplikasi (Security Assessment)
# Standar Acuan: OWASP ASVS 5.0 (Application Security Verification Standard)
# Proyek: TampilKit Booking — Basic Booking Template (PawCare Grooming)

**Versi:** 0.8.0  
**Tanggal:** 23 Oktober 2026  
**Auditor:** Application Security & Reliability Engineer  
**Status Temuan:** **0 Critical, 0 High, 0 Medium Open Findings**

---

## 1. Verifikasi Arsitektur Keamanan (Architecture & Threat Modeling)

Aplikasi dibangun dengan prinsip pertahanan berlapis (*Defense-in-Depth*):
- **Server-First Boundary**: Seluruh mutasi data dan operasi sensitif diisolasi pada Server Components dan Route Handlers berotentikasi.
- **Client Shield**: Modul storage MinIO dan utilitas enkripsi ditandai dengan `import "server-only"` untuk mencegah kebocoran runtime ke bundel client browser.
- **Kredensial Terenkripsi**: Tidak ada rahasia atau kunci API yang di-hardcode dalam kode sumber; seluruh konfigurasi runtime divalidasi via Zod (`src/config/env.ts`).

---

## 2. Rincian Pengujian Berdasarkan Domain OWASP ASVS

### V2 — Authentication & Password Security
- **Hashing Kata Sandi**: Menggunakan **Argon2id** (memory cost 64MB, iterations 3, parallelism 1) via `@node-rs/argon2`.
- **Dual-JWT Cookies**:
  - `pawcare_access_token`: Masa berlaku 15 menit, dikirim via `HttpOnly`, `SameSite=Lax`, dan `Secure` pada mode produksi.
  - `pawcare_refresh_token`: Masa berlaku 7 hari dengan rotasi otomatis setiap kali digunakan (*Refresh Token Rotation*).
- **Deteksi Penggunaan Ulang Token (*Reuse Detection*)**: Jika refresh token lama dicoba digunakan kembali, sistem mencabut seluruh silsilah sesi (*family revocation*) dan memutus akses.
- **Pencabutan Sesi**: Dukungan logout mandiri per perangkat maupun `Logout All Sessions`.

### V3 — Role-Based Access Control (RBAC) & IDOR
- Seluruh endpoint di `/api/admin/*` dan halaman `/dashboard/*` dilindungi guard server `requireAuth()`.
- Pembatasan ketat hak akses:
  - Tindakan integrasi OAuth Google (connect, disconnect, select calendar) dibatasi mutlak hanya untuk peran `OWNER`.
  - Akses detail booking dan pelanggan dilindungi dari kerentanan IDOR dengan memverifikasi kepemilikan relasi bisnis (`businessId`).
  - Portal tamu (`/booking/manage`) hanya dapat diakses melalui token acak aman yang dicocokkan dengan hash SHA-256 di basis data.

### V4 — Sanitasi Input & Web Security
- **Proteksi SQL Injection**: Seluruh kueri basis data dieksekusi melalui **Prisma ORM** yang menggunakan parameterized queries secara native.
- **Proteksi XSS**:
  - React secara default meng-escape seluruh konten dinamis.
  - Data JSON-LD pada Server Components disanitasi menggunakan substitusi karakter unicode aman (`\u003c` dan `\u003e`) untuk mencegah serangan *script tag breakout*.
- **HTTP Security Headers**: Dikonfigurasikan di `next.config.ts`:
  - `X-Frame-Options: DENY` (mencegah Clickjacking).
  - `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
  - `Content-Security-Policy`: Pembatasan skrip dan objek eksternal.

### V5 — Keamanan File & Media MinIO
- Pemeriksaan berkas unggahan di `/api/media/upload` menerapkan validasi **Magic Bytes** (tanda tangan biner header file) untuk memastikan berkas benar-benar berformat JPEG, PNG, atau WebP yang sah.
- Format file berbahaya seperti SVG (potensi Stored XSS) atau berkas eksekutabel ditolak otomatis.
- Ukuran unggahan dibatasi maksimal 5MB per berkas.

### V6 — Keamanan Google OAuth & Webhook
- Parameter `state` pada alur OAuth 2.0 PKCE ditandatangani menggunakan **HMAC-SHA256** dengan masa kedaluwarsa 10 menit dan bersifat *one-time use* untuk mencegah serangan OAuth CSRF dan Account Mix-Up.
- Token `refresh_token` dan `access_token` dari Google disimpan dalam bentuk terenkripsi **AES-256-GCM** dengan kunci server terisolasi.
- Endpoint webhook `/api/webhooks/google-calendar` memverifikasi token channel menggunakan perbandingan waktu konstan (`crypto.timingSafeEqual`) untuk menangkal serangan *timing attack*.

---

## 3. Register Temuan Keamanan (Security Findings Register)

| ID | Tingkat Keparahan | Modul | Deskripsi | Status | Mitigasi / Perbaikan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Rendah | Webhook Google | Potensi timing attack pada verifikasi token webhook channel | **RESOLVED** | Diperbaiki menggunakan `crypto.timingSafeEqual`. |
| **SEC-02** | Rendah | Error Handling | Potensi kebocoran pesan error internal basis data ke client | **RESOLVED** | Diperbaiki di `src/lib/api-response.ts` dengan sanitasi pesan error publik. |
| **SEC-03** | Rendah | Header Keamanan | Belum adanya HTTP security headers bawaan pada respons web | **RESOLVED** | Diterapkan di `next.config.ts` (X-Frame-Options, CSP, nosniff). |

---

## 4. Kesimpulan Keamanan

Aplikasi telah lulus audit kepatuhan keamanan aplikasi OWASP ASVS 5.0 level dasar hingga menengah dengan **0 temuan Kritis/Tinggi**, dan dinyatakan **AMAN** untuk operasional.
