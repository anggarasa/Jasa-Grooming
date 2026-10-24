# Spesifikasi Teknis: TampilKit Booking (Phase 01 — Foundation & Infrastructure)

## 1. Ringkasan Eksekutif & Tujuan Bisnis
- TampilKit Booking adalah template web pemesanan (appointment booking) modular berstandar produksi yang fleksibel untuk berbagai industri jasa.
- Implementasi awal difokuskan pada use-case **Jasa Pet Grooming** ("PawCare Grooming") dengan antarmuka berbahasa Indonesia yang ramah pengguna.
- Tujuan Phase 01: Membangun fondasi arsitektur modular monolith, skema basis data PostgreSQL via Prisma, integrasi storage MinIO S3, endpoint health check terintegrasi, serta landing page publik yang siap dikembangkan ke modul booking & auth (Phase 02+).

## 2. User Stories & Kebutuhan
- **User Stories**:
  - Sebagai pengunjung, saya dapat melihat landing page PawCare Grooming yang responsif, katalog layanan, serta informasi bisnis untuk memahami penawaran jasa.
  - Sebagai pengembang/admin, saya dapat memverifikasi kesiapan sistem via health check (`/api/health`), menjalankan migrasi DB, dan melakukan seed data awal secara idempotent.
- **Kebutuhan Fungsional**:
  - Halaman publik landing page (Navbar, Hero, Layanan Unggulan, Keunggulan, CTA, Footer).
  - Health check endpoint (`GET /api/health`) memeriksa status server, koneksi PostgreSQL, dan MinIO S3 bucket.
  - Utility client MinIO (upload, delete, presigned URL) terisolasi di server-side.
  - Skema data relasional lengkap (User, Business, Service, Customer, Pet, Booking, Calendar).
- **Kebutuhan Non-Fungsional**:
  - Strict type checking (TypeScript strict mode), validasi runtime environment variable via Zod.
  - UI responsif (mobile-first), aksesibel, performa TTFB < 200ms lokal, font Geist.
  - Bahasa antarmuka: Seluruh teks antarmuka publik menggunakan Bahasa Indonesia.

## 3. Tech Stack & Kebutuhan Layer
- **Framework**: Next.js (App Router, React 19/LTS, Node.js 24 LTS).
- **Language & Validation**: TypeScript (strict), Zod.
- **Database & ORM**: PostgreSQL, Prisma ORM (singleton client di `src/lib/prisma.ts`).
- **Object Storage**: MinIO (S3-compatible via Docker Desktop, bucket `tampilkit-booking`).
- **Styling & UI**: Tailwind CSS, shadcn/ui, Lucide React.
- **Testing**: Vitest + React Testing Library.
- **Package Manager**: npm ONLY (package-lock.json).
- `Butuh: Backend=ya, Frontend Web=ya, Mobile=tidak, Perubahan UI=ya`

## 4. Lokasi Kode & Struktur Folder
- **Lokasi**: Root workspace (`./`)
- **Struktur Folder**:
  - `prisma/`: `schema.prisma`, `migrations/`, `seed.ts`
  - `public/`: Aset statis (logo, ikon, gambar dummy)
  - `src/app/`: `(public)/page.tsx`, `api/health/route.ts`, `globals.css`, `layout.tsx`
  - `src/components/`: `ui/` (shadcn), `common/` (header, footer), `layouts/`
  - `src/config/`: `env.ts` (Zod validation), `site.ts`
  - `src/lib/`: `prisma.ts`, `minio.ts`, `utils.ts`
  - `src/modules/`: Domain terisolasi (`business/`, `services/`, `bookings/`, `storage/`)
  - `tests/`: Unit & integration tests (`health.test.ts`, `env.test.ts`, `homepage.test.tsx`)

## 5. Kontrak Data/API & Alur Layer
- **Entity Utama (Prisma)**:
  - `User` (id, name, email unique, passwordHash, role: OWNER | ADMIN, isActive, timestamps)
  - `Business` & `BusinessSetting` (nama bisnis, slug, setting booking interval & buffer, mata uang IDR)
  - `ServiceCategory` & `Service` (kategori, nama, slug, durasi menit, harga Decimal, imageObjectKey)
  - `Customer` & `Pet` (data pelanggan, relasi hewan peliharaan: nama, jenis/ras, usia, catatan)
  - `Booking` (relasi Business, Customer, Pet, Service; bookingCode, startAt, endAt, status: PENDING | CONFIRMED | COMPLETED | CANCELLED | NO_SHOW)
  - `CalendarConnection` & `CalendarEventMapping` (fondasi integrasi Google Calendar)
- **API Endpoints (Phase 01)**:
  - `GET /api/health` -> `{ status: "ok"|"degraded", timestamp: string, services: { database: "healthy"|"unhealthy", storage: "healthy"|"unhealthy" } }`
- **Alur Data**:
  - Client Request -> Next.js Route Handler / Server Component -> Module Service / Lib Client -> PostgreSQL / MinIO -> Response JSON / SSR UI.

## 6. Brief Desain untuk Designer
- **Karakter & Mood**: Bersih, Modern, Hangat & Terpercaya, Ramah Hewan (Pet-Friendly Professional).
- **Tipografi**: Geist Sans (Clean & Highly Legible).
- **Palet Warna**:
  - Primary Navy (`#142C52`): Elemen utama, header, dan teks dominan
  - Secondary Soft Blue (`#EAF2FF`): Background aksen dan container sekunder
  - Accent Teal (`#0D9488`): Tombol aksi utama (CTA), badge, dan sorotan interaktif
  - Background & Surface (`#F8FAFC` & `#FFFFFF`), Teks (`#0F172A`), Teks Redup (`#64748B`)
- **Komposisi Landing Page**: Header sticky, Hero section dengan value proposition dan tombol CTA, Preview katalog layanan grooming, Fitur keunggulan toko, dan Footer kontak.

## 7. Risiko, Asumsi & Pertanyaan Terbuka
- **Risiko**: Service lokal (PostgreSQL atau MinIO di Docker) belum aktif saat migrasi DB atau testing dijalankan.
- **Asumsi**:
  1. Koneksi PostgreSQL lokal (`postgresql://postgres:anggara-sa@localhost:5432/tampilkit_booking?schema=public`) telah tersedia atau dapat dibuat secara lokal.
  2. Fitur booking interaktif (pemilihan slot & form transaksi) dan autentikasi user diimplementasikan pada Phase 02 sesuai brief.
  3. MinIO berjalan di `http://localhost:9000` dengan bucket default `tampilkit-booking`.
- **Pertanyaan Terbuka**:
  1. Apakah service Docker MinIO dan PostgreSQL lokal Anda saat ini sudah dalam keadaan running dan siap menerima koneksi?
