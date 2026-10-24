# Spesifikasi Fitur: Phase 04 — Public Grooming Website & Dynamic Service Catalog

## 1. Ringkasan Eksekutif & Tujuan Bisnis
- Mengembangkan website publik interaktif dan responsif untuk PawCare Grooming menggunakan Next.js Server Components yang terhubung dinamis ke PostgreSQL dan MinIO.
- Menghadirkan katalog layanan lengkap dengan filter kategori, detail layanan, galeri dinamis, profil bisnis, jam operasional, dan SEO teroptimasi.
- Tujuan bisnis: Memaksimalkan konversi pengunjung menjadi pelanggan setia dan mempersiapkan fondasi alur reservasi sebelum Phase 05 (Online Booking).

## 2. User Stories & Kebutuhan
- **User Stories**:
  - Sebagai pengunjung, saya dapat melihat landing page, katalog layanan terfilter, foto galeri asli, profil toko, serta jadwal buka dan kontak toko.
  - Sebagai calon pelanggan, saya dapat melihat detail spesifik layanan dan menekan "Pesan Sekarang" yang mengarahkan ke halaman booking dengan konteks layanan.
- **Kebutuhan Fungsional**:
  - Reusable layout publik: Header (Nav, CTA booking, Mobile Sheet) & Footer (identitas, jam operasional, kontak dinamis, WhatsApp link).
  - Halaman Server Components: `/` (Home), `/services` (Katalog, search, filter `?category=`), `/services/[slug]` (Detail layanan, 404 jika nonaktif), `/gallery` (Grid foto & lightbox), `/about` (Profil & nilai bisnis), `/contact` (Kontak, jam operasional, peta), `/booking` (Placeholder transisi Phase 05).
  - Data Access Layer: `src/modules/public/` memuat helper query publik terisolasi (hanya data `isActive: true`).
  - Technical SEO: Dynamic `generateMetadata`, JSON-LD (`LocalBusiness`, `Service`), `/sitemap.xml`, `/robots.txt`, dan on-demand cache revalidation (`revalidatePath`).
- **Kebutuhan Non-Fungsional**:
  - Aksesibilitas WCAG 2.2 AA (kontras teks, label ARIA, alt text gambar), performa TTFB cepat, responsif di resolusi >= 320px, seluruh teks antarmuka Bahasa Indonesia.

## 3. Tech Stack & Kebutuhan Layer
- **Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, PostgreSQL + Prisma ORM, Tailwind CSS v4, Radix UI / shadcn, Lucide React, MinIO (via `/api/media/[...key]`).
- **Alasan**: Server Components memaksimalkan kecepatan muat dan indeks SEO, sedangkan Prisma memastikan efisiensi kueri basis data.
- `Butuh: Backend=ya, Frontend Web=ya, Mobile=tidak, Perubahan UI=ya`

## 4. Lokasi Kode & Struktur Folder
- `src/modules/public/`: Public data access services (`public-business.service.ts`, `public-services.service.ts`, `public-gallery.service.ts`, `public-operating-hours.service.ts`).
- `src/app/(public)/`: Layout publik terisolasi, `page.tsx`, `services/page.tsx`, `services/[slug]/page.tsx`, `gallery/page.tsx`, `about/page.tsx`, `contact/page.tsx`, `booking/page.tsx`.
- `src/app/sitemap.ts` & `src/app/robots.ts`: Metadata crawler dinamis.
- `src/components/public/`: Komponen UI publik (Navbar, Footer, ServiceCard, CategoryFilter, GalleryGrid, LightboxModal).
- `tests/public/`: Unit & integration tests untuk query publik, filter layanan, SEO metadata, dan render halaman.

## 5. Kontrak Data/API & Alur Layer
- **Entity Terlibat**: `Business`, `BusinessSetting`, `BusinessOperatingHour`, `ServiceCategory`, `Service`, `BusinessGallery`.
- **Data Access Layer**: Kueri read-only aman di `src/modules/public/` (hanya record aktif, diurutkan berdasarkan `displayOrder`).
- **Media Asset Endpoint**: Re-use `GET /api/media/[...key]` untuk menyajikan gambar cover layanan, logo toko, dan galeri secara aman.
- **Alur Data**: Client Request -> App Router Server Component -> Public Service Layer -> Prisma Query -> HTML SSR + JSON-LD -> Browser Client.

## 6. Brief Desain untuk Designer
- **Mood & Karakter**: Ramah hewan (pet-friendly), bersih, terpercaya, modern, dan profesional.
- **Palet Warna**: Primary Navy (`#142C52`), Secondary Soft Blue (`#EAF2FF`), Accent Teal (`#0D9488`), Background (`#F8FAFC`), Text (`#0F172A`).
- **Komponen Kunci**: Badge harga IDR transparan, kartu layanan dengan indikator durasi, filter kategori interaktif, lightbox galeri bersih, tombol CTA WhatsApp mengambang/kontras.

## 7. Risiko, Asumsi & Pertanyaan Terbuka
- **Risiko**: Inkonsistensi data tampilan publik jika cache Next.js tidak di-revalidate saat admin melakukan mutasi data di Phase 03.
- **Asumsi**:
  1. Halaman `/booking` pada Phase 04 menampilkan status layanan terpilih dan placeholder reservasi dengan CTA konfirmasi WhatsApp manual sebelum sistem booking otomatis aktif di Phase 05.
  2. Rute publik diisolasi dalam route group `(public)` agar tidak bertabrakan dengan layout dashboard admin.
- **Pertanyaan Terbuka**:
  1. Apakah ingin menambahkan floating WhatsApp button di seluruh halaman publik untuk mempermudah konsultasi langsung pelanggan?
