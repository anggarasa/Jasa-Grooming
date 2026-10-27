# TampilKit Booking — Basic Booking Template
## Phase 08 — Final QA, Security, Performance & Production Readiness

TampilKit Booking adalah template web appointment booking berbasis *modular monolith* berstandar produksi yang dirancang untuk dapat digunakan ulang (*reusable*) pada beragam bisnis berbasis reservasi. Pada implementasi awal, template ini dikonfigurasikan untuk use-case **Jasa Pet Grooming** (**PawCare Grooming**).

Seluruh antarmuka publik menggunakan Bahasa Indonesia, sedangkan kode sumber, model basis data, dan dokumentasi teknis menggunakan Bahasa Inggris & Indonesia formal.

> 📖 Dokumen panduan (alur sistem, runbook, laporan fase, desain) disimpan **lokal** di `docs/` dan tidak disertakan di repositori. Hanya README ini yang ikut ke GitHub.

---

## 1. Arsitektur & Teknologi

### Technology Stack
- **Framework Web**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Runtime**: Node.js 24 LTS & npm
- **Database & ORM**: PostgreSQL 15+ & [Prisma ORM](https://www.prisma.io/) v6.4+
- **Object Storage**: [MinIO S3](https://min.io/) (Docker Desktop)
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), Lucide React
- **Validasi Schema**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/) & React Testing Library

### Desain Sistem
- **Font**: Geist Sans & Geist Mono
- **Palet Warna**:
  - Primary Navy (`#142C52`)
  - Secondary Soft Blue (`#EAF2FF`)
  - Accent Teal (`#0D9488`)
  - Background (`#F8FAFC`) & Surface (`#FFFFFF`)
  - Text (`#0F172A`) & Muted (`#64748B`)

---

## 2. Struktur Proyek

Satu aplikasi Next.js dengan kode yang dipisah menjadi **frontend** (tampilan) dan **backend** (logika bisnis & data). Tetap satu server, satu perintah `npm run dev`; URL, API, dan login tidak berubah.

```text
├── frontend/                     # TAMPILAN (aplikasi Next.js)
│   ├── app/                      # Halaman publik, /login, /dashboard
│   │   ├── api/**/route.ts       # Pintu API: 1 baris yang meneruskan ke backend/api
│   │   └── globals.css           # Token tema & motion
│   ├── components/               # Komponen UI (publik, booking, dashboard, ui/)
│   ├── lib/                      # Helper tampilan (utils, format tanggal, SEO, klien API)
│   ├── config/site.ts            # Metadata & navigasi situs
│   ├── public/                   # Gambar & aset statis
│   ├── tests/                    # Tes tampilan (React Testing Library)
│   └── next.config.ts
├── backend/                      # LOGIKA & DATA
│   ├── api/**/route.ts           # Isi 60 endpoint API
│   ├── modules/                  # Domain: auth, bookings, availability, business, services, …
│   ├── lib/                      # prisma, minio, enkripsi, cache, auth server/cookie
│   ├── config/env.ts             # Validasi environment (Zod)
│   ├── prisma/                   # schema.prisma, migrations/, seed.ts
│   ├── workers/                  # Worker & sinkronisasi Google Calendar
│   ├── scripts/                  # Bootstrap owner, backup drill, data contoh
│   └── tests/                    # Tes unit & integrasi backend
├── .env.example / .env.local     # Konfigurasi (tetap di akar proyek)
├── package.json                  # Satu daftar dependensi & semua perintah
├── tsconfig.json                 # Alias: @/… → frontend, @backend/… → backend
└── vitest.config.mts
```

Aturan arah ketergantungan: **frontend boleh memakai backend** (`@backend/...`), **backend tidak boleh memakai frontend** (`@/...`).

---

## 3. Persyaratan Sistem & Konfigurasi Lokal

- **Node.js**: versi 24 LTS atau terbaru (`node -v`)
- **npm**: versi 11+ (`npm -v`)
- **PostgreSQL**: instance lokal di port `5432`
- **MinIO**: instance Docker Desktop lokal di port `9000` (API) & `9001` (Console)

### Konfigurasi `.env.local`
Salin template dari `.env.example`:
```bash
cp .env.example .env.local
```

Sesuaikan nilai koneksi:
```env
NODE_ENV="development"
NEXT_PUBLIC_APP_NAME="TampilKit Booking"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

DATABASE_URL="postgresql://postgres:PASSWORD_ANDA@localhost:5432/tampilkit_booking?schema=public"

MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="tampilkit-booking"
```

---

## 4. Perintah Instalasi & Eksekusi

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Migrasi Basis Data & Client Generation
Pastikan PostgreSQL sudah aktif, kemudian jalankan migrasi:
```bash
npm run db:migrate
```

### 3. Eksekusi Seed Data Awal (Idempotent)
Mengisi data profil bisnis PawCare Grooming, kategori layanan, daftar layanan, dan akun pengembang:
```bash
npm run db:seed
```

### 4. Eksekusi Pengujian (Testing)
```bash
npm run test:frontend   # tes tampilan
npm run test:backend    # tes backend (integrasi butuh database & menulis data uji)
npm run test            # semuanya
```

### 5. Typecheck & Linter
```bash
npm run typecheck
npm run lint
```

### 6. Menjalankan Aplikasi
Mode pengembangan (*development*):
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

Mode produksi (*production build & start*):
```bash
npm run build
npm run start
```

Worker Google Calendar (proses terpisah):
```bash
npm run calendar:worker
```

---

## 5. Health Check Endpoint

Endpoint kesiapan sistem tersedia di:
`GET /api/health`

**Contoh Response Sukses (HTTP 200)**:
```json
{
  "status": "ok",
  "application": "tampilkit-booking",
  "version": "0.1.0",
  "timestamp": "2026-10-22T17:20:14.000Z",
  "services": {
    "database": "healthy",
    "storage": "healthy"
  }
}
```
Jika basis data atau MinIO storage terputus, endpoint akan mengembalikan status HTTP `503` dengan pesan detail status layanan yang tersanitasi tanpa membocorkan credential.

---

## 6. Roadmap Fase Pengembangan

- **Phase 01 — Project Foundation & Infrastructure** ✅ Selesai (Fondasi Next.js, Prisma, MinIO, UI Landing Page, Health Check, Test Suite).
- **Phase 02 — Authentication & Role-Based Access** ✅ Selesai (Argon2id, Dual-JWT HttpOnly Cookies, Session Lineage & Token Reuse Detection, Admin Dashboard, Sessions Manager, Owner CLI).
- **Phase 03 — Business Settings, Service Management & MinIO Media** ✅ Selesai (Profil Bisnis, Jam Operasional 7 hari & multi-break, Konfigurasi Booking, Katalog Layanan Decimal IDR & Kategori, Galeri Toko, Upload MinIO S3 dengan verifikasi magic bytes).
- **Phase 04 — Public Grooming Website & Dynamic Service Catalog** ✅ Selesai (Website Publik Dinamis RSC, Katalog & Filter Layanan, Detail Layanan, Galeri Lightbox, Tentang Kami, Kontak & WhatsApp FAB, Technical SEO JSON-LD, Sitemap & Robots).
- **Phase 05 — Booking Engine, Availability & Customer Reservation** ✅ Selesai (Availability slot generator, PostgreSQL advisory lock anti-double booking, Idempotensi, Guest Access Token, Wizard booking publik 6 langkah di `/booking`, `/booking/confirmation`, dan `/booking/manage`).
- **Phase 06 — Admin Booking Dashboard & Appointment Management** ✅ Selesai (Dashboard overview 6 KPI harian riil, master booking table server-paginated, detail booking & snapshots, kalender Day/Week/Month dengan striped blocked-time, walk-in booking wizard, direktori pelanggan & anabul, manajemen pemblokiran waktu stasiun, audit logs, dan state machine status).
- **Phase 07 — Google Calendar OAuth, FreeBusy & Bidirectional Synchronization** ✅ Selesai (OAuth 2.0 PKCE, enkripsi token AES-256-GCM, outbox queue & worker, sinkronisasi dua arah mutasi booking/block, integrasi Google FreeBusy fail-closed pada Availability Engine, webhook push notifications, incremental syncToken, dan dashboard rekonsiliasi konflik).
- **Phase 08 — Final QA, Security, Performance & Production Readiness** ✅ Selesai (Audit regresi fungsional Journeys A–G, pengujian stres konkurensi PostgreSQL 10 skenario zero double-booking, hardening keamanan OWASP ASVS 5.0, performa p95 read < 55ms / write < 80ms, a11y WCAG 2.1 AA, SOP & skrip backup/restore drill, uji reusabilitas Studio Barber, paket runbook produksi lengkap, evaluasi GO/NO-GO).
