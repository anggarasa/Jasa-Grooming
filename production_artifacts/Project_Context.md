# Project Context: TampilKit Booking (PawCare Grooming)

> Dokumen ini diperbarui oleh skill `onboarding/read_project.md` untuk mencatat arahan desain visual baru dari referensi gambar dan font Plus Jakarta Sans.

---

## 1. Status Proyek
- **Tipe**: Proyek Berjalan (*Existing / Brownfield*)
- **Domain**: Layanan Reservasi / Appointment Booking Pet Grooming (*PawCare Grooming / Studio & Spa*)
- **Arsitektur**: Next.js Fullstack Modular Monolith

---

## 2. Tech Stack Terdeteksi & Konfigurasi Desain
- **Framework & Runtime**: Next.js 16.4.2 (App Router, Turbopack) di atas Node.js 24+ (TypeScript Strict Mode)
- **Tipografi Utama**: **Plus Jakarta Sans** (`next/font/google`), menggantikan font sebelumnya di seluruh antarmuka publik dan dashboard.
- **Frontend & Styling**: 
  - React 19.3.0
  - Tailwind CSS v4 (`@import "tailwindcss"`) dengan CSS Custom Properties / Design Tokens
  - Radix UI Primitives (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-slot`, dsb.)
  - Lucide React (ikon pendukung UI)
  - Sonner (toaster notifikasi)
- **Database & ORM**: PostgreSQL dengan Prisma ORM 6.4.1
- **Autentikasi & Otorisasi**: Custom JWT (Access Token + Refresh Token Rotation, Argon2id, RBAC OWNER & ADMIN)
- **Penyimpanan Media**: MinIO Object Storage (S3-compatible) via Docker
- **Integrasi Eksternal**: Google Calendar API v3 (OAuth 2.0, Outbox Worker Queue, Push Webhook, Conflict Handling)
- **Validasi Data & Form**: Zod 4, React Hook Form
- **Testing**: Vitest 5.0.5, @testing-library/react, JSDOM
- **Package Manager**: npm ONLY (`package-lock.json`)

---

## 3. Direktif Desain Visual Baru (Berdasarkan Referensi Gambar)
1. **Identitas & Estetika Visual**:
   - Modern Minimalist Pet Boutique & Care (Scandinavian aesthetic).
   - Hero Section: Latar belakang warna mineral sage/eucalyptus lembut yang menenangkan (`#B4C4B9` / `#A5B8AA`), kontras tajam dengan tipografi judul warna putih berhuruf kapital tegas (*bold display*).
   - Bentuk Geometris: Desain didominasi bentuk kapsul / pil penuh (`rounded-full`) untuk tombol aksi, kolom pencarian, tag filter, dan badge trust social proof.
   - Kartu & Wadah Konten: Sudut melengkung halus yang lega (`rounded-3xl` / `rounded-[28px]`), bayangan halus tanpa kontur kaku, border tipis berona abu-abu terang.
   - Palet Tombol Aksi: Tombol kapsul hitam tegas (`#111827` / `#000000`) dengan teks putih untuk CTA utama ("Booking Sekarang", tombol navigasi panah), dipadukan dengan tombol kapsul putih atau transparan berkontur untuk aksi sekunder.
2. **Cakupan Redesign**:
   - Seluruh halaman publik: Header navigasi, Hero section, Bilah pencarian & filter pil kategori, Kartu Layanan Terpopuler, Kartu Kategori Perawatan, Banner Langganan/Promo, Footer lengkap.
   - Halaman Pemesanan (Booking Wizard) & Manajemen Tamu.
   - Halaman Portal Masuk (Login).
   - Halaman Dashboard Admin: Sidebar, Top Navigation, Tabel Pemesanan, Kartu Statistik, dan Manajemen Layanan.
