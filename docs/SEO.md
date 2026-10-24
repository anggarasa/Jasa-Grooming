# Dokumentasi Technical SEO & Structured Data: Phase 04

Dokumen ini menjelaskan implementasi Technical SEO, Dynamic Metadata, Schema.org JSON-LD, Sitemap, dan Robots pada **TampilKit Booking**.

---

## 1. Dynamic Metadata Generation

Setiap rute publik mengimplementasikan fungsi `generateMetadata()` bawaan Next.js App Router:
- **Judul Dinamis**: Format `[Nama Halaman] | [Nama Bisnis]` (contoh: `Katalog Layanan Grooming | PawCare Grooming`).
- **Deskripsi Meta**: Diambil dari deskripsi profil bisnis atau ringkasan layanan di PostgreSQL.
- **Canonical URLs**: Ditautkan ke URL resmi situs (`NEXT_PUBLIC_APP_URL`).
- **OpenGraph & Twitter Card**: Menyediakan pratinjau kartu media sosial dengan judul, deskripsi, gambar preview, dan tipe entitas.

---

## 2. Schema.org JSON-LD Structured Data

Dibangun menggunakan utilitas aman XSS di `src/lib/seo.ts`:
- **`LocalBusiness` (Beranda & Kontak)**:
  - `@type`: `LocalBusiness` / `AnimalShelter` / `VeterinaryCare`
  - Nama usaha, alamat fisik (`PostalAddress`), nomor telepon, tautan logo, dan spesifikasi jam operasional mingguan (`OpeningHoursSpecification`).
- **`Service` (Detail Layanan `/services/[slug]`)**:
  - `@type`: `Service`
  - Nama layanan, deskripsi, penyedia (`provider`), dan penawaran harga (`Offer` dengan mata uang `IDR`).
- **`BreadcrumbList`**:
  - Navigasi remah roti berhierarki untuk kemudahan pengindeksan bot mesin pencari.
- **Proteksi Sanitasi**: Seluruh string JSON-LD di-serialize menggunakan fungsi `serializeJsonLd()` yang melakukan escape karakter `<` (`\u003c`), `>` (`\u003e`), `&` (`\u0026`), serta karakter pemisah baris unicode `\u2028` dan `\u2029` untuk mencegah serangan script-breakout XSS.

---

## 3. Sitemap & Robots

- **Sitemap Dinamis (`src/app/sitemap.ts`)**:
  - Dihasilkan secara otomatis di `/sitemap.xml`.
  - Mengindeks seluruh rute statis publik (`/`, `/services`, `/gallery`, `/about`, `/contact`) dan seluruh rute dinamis layanan aktif (`/services/${slug}`).
  - Halaman administratif `/dashboard/*` dan rute autentikasi privat **dikecualikan** secara ketat.
- **Robots.txt (`src/app/robots.ts`)**:
  - Dihasilkan di `/robots.txt`.
  - Mengizinkan perayapan (*crawl*) untuk seluruh agen bot publik pada rute utama dan melarang perayapan pada `/dashboard/` dan `/api/auth/`.
