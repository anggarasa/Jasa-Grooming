# Spesifikasi Fitur: Phase 02 — JWT Authentication & Admin Access

## 1. Ringkasan Eksekutif & Tujuan Bisnis
- Mengimplementasikan sistem autentikasi mandiri berstandar enterprise berbasis Argon2id, dual-JWT (jose), dan sesi rotasi refresh token di PostgreSQL dengan deteksi reuse.
- Menyediakan portal admin (`/dashboard`) yang aman bagi pemilik bisnis (Owner/Admin) PawCare Grooming untuk memantau status aplikasi, profil, keamanan akun, dan sesi aktif.
- Menjamin zero-external-auth vendor lock-in, proteksi CSRF/origin, rate limiting, serta kepatuhan data via HttpOnly secure cookies dan audit logging.

## 2. User Stories & Kebutuhan
- **User Stories**:
  - Sebagai Owner/Admin, saya dapat login di `/login` dengan aman untuk mengelola operasional PawCare Grooming.
  - Sebagai Admin, saya dapat memperbarui profil, mengganti password, memantau sesi aktif, dan mencabut sesi di perangkat lain atau semua perangkat.
- **Kebutuhan Fungsional**:
  - Autentikasi kredensial (email & Argon2id), penerbitan token access (15m) & refresh (7d) via HttpOnly cookies (`tk_access`, `tk_refresh`).
  - Refresh token rotation dengan lineage tracking & reuse detection di DB (`AuthSession`, `RefreshTokenRecord`).
  - Proteksi rute (middleware & server guard), RBAC (`OWNER`, `ADMIN`), rate limiting, CSRF/origin check, audit log (`AuthAuditLog`), dan CLI provisioning owner (`npm run auth`).
- **Kebutuhan Non-Fungsional**: Tanpa token di browser storage (localStorage/sessionStorage), penanganan atomic concurrent refresh, UI berbahasa Indonesia, dan Vitest suite.

## 3. Tech Stack & Kebutuhan Layer
- **Auth Core**: `jose` (JWT sign & verify), `argon2` / `@node-rs/argon2` (password hash), Prisma ORM (PostgreSQL session & audit models).
- **Frontend & UI**: Next.js App Router, React Hook Form, Zod, Radix UI, Tailwind CSS v4, Lucide React, Sonner toast.
- `Butuh: Backend=ya, Frontend Web=ya, Mobile=tidak, Perubahan UI=ya`

## 4. Lokasi Kode & Struktur Folder
- `src/modules/auth/`: `auth.service.ts`, `tokens.ts`, `password.ts`, `session.service.ts`, `guard.ts`, `rate-limit.ts`, `schemas.ts`
- `src/app/(auth)/login/`: Halaman login admin interaktif.
- `src/app/(admin)/dashboard/`: Layout dashboard terproteksi, `page.tsx` (overview), `profile/`, `security/`, `sessions/`.
- `src/app/api/auth/`: Endpoint handlers (`login/`, `refresh/`, `logout/`, `me/`, `change-password/`, `sessions/`).
- `scripts/bootstrap-owner.ts`: Script CLI pembuat akun owner awal via `npm run auth`.
- `tests/auth/`: Suite pengujian unit & integrasi keamanan autentikasi.

## 5. Kontrak Data/API & Alur Layer
- **Model Prisma Baru**:
  - `AuthSession`: id, userId, userAgent, ipAddress, isRevoked, expiresAt, createdAt, updatedAt.
  - `RefreshTokenRecord`: id, sessionId, tokenHash, isUsed, replacedByTokenId, createdAt.
  - `AuthAuditLog`: id, userId, action, ipAddress, userAgent, metadata (Json), createdAt.
  - Penambahan kolom `tokenVersion Int @default(0)` pada model `User`.
- **API Endpoints**:
  - `POST /api/auth/login` -> Verifikasi Argon2id, terbitkan session & set cookies `tk_access` & `tk_refresh`.
  - `POST /api/auth/refresh` -> Validasi cookie refresh, rotasi token record, set cookie baru (deteksi reuse membatalkan seluruh lineage).
  - `POST /api/auth/logout` -> Revoke sesi aktif / semua sesi, bersihkan cookie auth.
  - `GET /api/auth/me` -> Data profil & role pengguna yang sedang terotentikasi.
  - `POST /api/auth/change-password` -> Verifikasi password lama, hash baru, inkremen `tokenVersion`, cabut sesi lain.
  - `GET /api/auth/sessions` & `POST /api/auth/sessions/revoke` -> Daftar sesi aktif & pencabutan sesi spesifik.
- **Alur Data**: Client Request -> Middleware/Server Guard (verifikasi JWT & status session DB) -> Service Module -> Prisma -> Response + Cookie mutation.

## 6. Brief Desain untuk Designer
- **Mood**: Profesional, terpercaya, modern, senada dengan palet PawCare Grooming (Navy `#142C52`, Soft Blue `#EAF2FF`, Aksen Teal `#0D9488`).
- **Halaman**: Card login minimalis terpusat dengan branding jelas; layout dashboard bersih dengan sidebar navigasi responsif, card status akun, tabel sesi aktif, dan feedback notifikasi toast (Sonner).

## 7. Risiko, Asumsi & Pertanyaan Terbuka
- **Risiko**: Race condition pada request refresh konkuren di browser memicu false-positive reuse detection (mitigasi: grace period rotasi 15-30 detik).
- **Asumsi**: Modul `argon2` / `@node-rs/argon2` dan `jose` diinstal via `npm`; provisioning owner menggunakan `tsx scripts/bootstrap-owner.ts`.
- **Pertanyaan Terbuka**:
  1. Apakah grace period rotasi refresh token sebesar 15–30 detik disetujui untuk mentolerir request bersamaan dari browser?
