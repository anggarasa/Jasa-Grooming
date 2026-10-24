# TampilKit Booking — Basic Booking Template
## Phase 08 — Final QA, Security, Performance & Production Readiness

TampilKit Booking adalah template web appointment booking berbasis *modular monolith* berstandar produksi yang dirancang untuk dapat digunakan ulang (*reusable*) pada beragam bisnis berbasis reservasi. Pada implementasi awal, template ini dikonfigurasikan untuk use-case **Jasa Pet Grooming** (**PawCare Grooming**).

Seluruh antarmuka publik menggunakan Bahasa Indonesia, sedangkan kode sumber, model basis data, dan dokumentasi teknis menggunakan Bahasa Inggris & Indonesia formal.

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

```text
├── prisma/
│   ├── schema.prisma             # Skema 10 model relasional PostgreSQL
│   ├── migrations/               # Riwayat migrasi versioned Prisma
│   └── seed.ts                   # Seed idempotent (PawCare Grooming & user)
├── public/                       # Static assets
├── src/
│   ├── app/
│   │   ├── api/health/route.ts   # Health check API (DB & MinIO connectivity)
│   │   ├── globals.css           # Token Tailwind CSS & shadcn variables
│   │   ├── layout.tsx            # Root layout & font Geist
│   │   └── page.tsx              # Landing page publik PawCare Grooming
│   ├── components/
│   │   ├── common/               # Komponen spesifik fitur (Hero, Navbar, dll)
│   │   └── ui/                   # Komponen fondasi shadcn/ui
│   ├── config/
│   │   ├── env.ts                # Validasi environment runtime Zod
│   │   └── site.ts               # Metadata & navigasi situs
│   ├── lib/
│   │   ├── minio.ts              # Server-only S3 storage utility singleton
│   │   ├── prisma.ts             # Singleton Prisma Client dev-safe
│   │   └── utils.ts              # Helper kelas styling (clsx, tailwind-merge)
│   └── modules/                  # Batas domain untuk fase mendatang
├── tests/
│   ├── integration/              # Health check integration tests
│   ├── mocks/                    # Mocking server-only & SDK
│   └── unit/                     # Unit test env, minio utility, homepage UI
├── docs/
│   ├── ARCHITECTURE.md           # Rincian arsitektur & alur data
│   └── PHASE_01_REPORT.md        # Laporan lengkap implementasi Phase 01
├── .env.example                  # Template konfigurasi environment tersanitasi
├── .env.local                    # Konfigurasi kredensial lokal (diabaikan git)
└── package.json                  # Script & dependensi proyek
```

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

DATABASE_URL="postgresql://postgres:anggara-sa@localhost:5432/tampilkit_booking?schema=public"

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
Jalankan suite pengujian lengkap dengan Vitest:
```bash
npm run test
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
