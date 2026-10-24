# Spesifikasi Fitur: Integrasi Gambar Asli (Real Media Assets) & Seeding Layanan + Galeri

## 1. Ringkasan Eksekutif
Fitur ini bertujuan untuk melengkapi proyek PawCare Grooming dengan gambar-gambar asli (*real high-quality photography*) hewan peliharaan (anjing dan kucing setelah perawatan grooming, fasilitas salon steril, dan penanganan ramah). Gambar asli ini akan diintegrasikan langsung ke dalam data dummy database via `prisma/seed.ts` (layanan dan galeri foto), komponen hero beranda, dan penyedia layanan media lokal yang tangguh (*local file fallback*) sehingga gambar tetap tampil sempurna baik saat MinIO aktif maupun saat berjalan di lingkungan dev mandiri.

---

## 2. Kebutuhan Fungsional & Non-Fungsional

### Fungsional:
1. **Penyimpanan Aset Media Asli**:
   - Menyiapkan berkas gambar terkompresi optimal (format WebP/JPEG) di direktori publik:
     - **Hero Visual**: `public/images/hero/hero-pet.webp` (potret anabul bersih nan lucu untuk hero showcase).
     - **Logo Bisnis**: `public/media/business/logos/logo.webp`.
     - **Foto Layanan Grooming (5 paket)**:
       - `services/images/cat-basic.webp` (Basic Cat Grooming)
       - `services/images/cat-spa.webp` (Complete Cat Spa)
       - `services/images/dog-basic.webp` (Basic Dog Grooming)
       - `services/images/dog-styling.webp` (Full Styling & Haircut Dog)
       - `services/images/treatment-parasite.webp` (Treatment Anti Kutu & Jamur)
     - **Foto Galeri Dokumentasi (4-6 item)**:
       - `gallery/images/salon-facility.webp` (Area grooming steril & meja hidrolik)
       - `gallery/images/cat-persian-groom.webp` (Kucing persia bersih & wangi)
       - `gallery/images/dog-poodle-groom.webp` (Anjing poodle hasil potong rapi)
       - `gallery/images/dog-bath-fun.webp` (Anjing riang saat mandi busa)
2. **Penyedia Media Tangguh (*Robust Stream Delivery*)**:
   - Memperbarui `src/modules/storage/media.service.ts` agar memeriksa keberadaan file fisik di `public/media/` atau direktori aset lokal sebelum memanggil MinIO. Jika MinIO offline (misal Docker tidak berjalan), sistem otomatis menyajikan file langsung dari disk lokal dengan header MIME type & caching yang valid.
3. **Database Seeding (`prisma/seed.ts`)**:
   - Mendaftarkan entri `MediaAsset` untuk setiap gambar.
   - Memperbarui `business.logoObjectKey`.
   - Menghubungkan setiap `Service` dengan `imageObjectKey` yang relevan.
   - Menambahkan *seeding* entitas `GalleryItem` (yang sebelumnya belum ada di seed) lengkap dengan `caption`, `altText`, dan `displayOrder`.
4. **Hero Landing Page (`src/app/(public)/page.tsx`)**:
   - Mengganti representasi emoji `🐕` dengan elemen foto asli `hero-pet.webp` yang serasi dengan bingkai `rounded-[32px]` Scandinavian modern.

### Non-Fungsional:
- **Performa & Ukuran File**: Gambar dioptimalkan (< 150KB per berkas) agar waktu muat cepat (LCP < 1.2 detik).
- **Zero Regression**: Semua 47 file pengujian dan 355 unit/integration test tetap lulus 100%.

---

## 3. Tech Stack & Komponen Terkait
- **Peran Engineer**: `@backend` (seeding database & fallback streaming media) dan `@frontend` (hero image & kartu layanan/galeri).
- **Penyimpanan**: Dual-mode (Local Disk Asset + MinIO kompatibel).
- **Database**: PostgreSQL (Prisma ORM `Service`, `GalleryItem`, `MediaAsset`, `Business`).

---

## 4. Alur Data & Arsitektur
1. **Seed Execution (`npx prisma db seed`)**:
   - Membaca metadata gambar -> membuat `MediaAsset` -> memperbarui `Service.imageObjectKey` -> membuat `GalleryItem`.
2. **Client Request (`<img src="/api/media/services/images/cat-basic.webp" />`)**:
   - Route `/api/media/[...key]` memanggil `getMediaStream(key)`.
   - Service mendeteksi file lokal `public/media/...` -> mengalirkan stream HTTP 200 dengan `Content-Type: image/webp` dan Cache-Control 24 jam.

---

## 5. Pertanyaan Persetujuan
Apakah Anda menyetujui rancangan spesifikasi fitur ini? Silakan balas **Setuju** untuk melanjutkan ke implementasi `@backend` dan `@frontend`.
