# Dokumentasi Website Publik & Katalog Layanan Dinamis: Phase 04

Dokumen ini menjelaskan arsitektur antarmuka publik, alur data dinamis, katalog layanan, akses media MinIO, dan integrasi reservasi pada **TampilKit Booking**.

---

## 1. Arsitektur Halaman Publik (Next.js App Router)

Seluruh halaman publik dibangun menggunakan pendekatan **React Server Components (RSC)** di dalam route group `src/app/(public)/`, memanfaatkan pembacaan data langsung dari PostgreSQL melalui lapisan data terisolasi di `src/modules/public/`.

### Struktur Rute Publik:
- **`/` (Beranda)**:
  - Hero Section dengan nama bisnis dinamis dari basis data, value proposition, dan CTA.
  - Section Keunggulan ("Kenapa Memilih Kami").
  - Katalog Layanan Unggulan (3–6 layanan aktif teratas).
  - Edukasi Alur Reservasi ("Cara Kerja Booking").
  - Pratinjau Galeri Foto toko.
  - Ringkasan Jam Operasional & Kontak.
  - Final CTA menuju `/booking`.
- **`/services` (Katalog Layanan)**:
  - Filter kategori interaktif berbasis URL search params (`/services?category=slug`).
  - Pencarian teks layanan.
  - Kartu harga moneter presisi `Decimal` dengan format Rupiah `Rp`.
  - State kosong jika tidak ada layanan yang cocok.
- **`/services/[slug]` (Detail Layanan)**:
  - Rute dinamis untuk layanan spesifik.
  - Pratinjau foto resolusi tinggi dari proxy MinIO S3.
  - Rincian durasi (menit), waktu jeda (buffer), dan deskripsi lengkap.
  - Tombol CTA menuju `/booking?service={serviceId}`.
  - Rekomendasi layanan terkait dalam kategori yang sama.
  - Otomatis memicu `notFound()` (HTTP 404) jika slug tidak valid atau nonaktif.
- **`/gallery` (Galeri Bisnis)**:
  - Grid gambar foto galeri promosi toko dari tabel `BusinessGallery`.
  - Lightbox interaktif modal untuk memperbesar foto dengan dukungan keyboard navigation (`Escape`, `ArrowLeft`, `ArrowRight`, focus trap WCAG 2.2 AA).
- **`/about` (Tentang Kami)**:
  - Profil dan deskripsi bisnis nyata dari PostgreSQL (bukan teks fiktif).
  - Nilai-nilai pelayanan ramah hewan.
  - Galeri pratinjau dan ajakan bertindak kontak.
- **`/contact` (Hubungi Kami)**:
  - Alamat operasional lengkap, nomor telepon, dan email.
  - Integrasi tombol WhatsApp langsung dengan nomor bisnis yang terkonfigurasi.
  - Tabel jam operasional mingguan lengkap (Senin–Minggu) beserta jeda istirahat (*breaks*).
  - Tautan lokasi Google Maps.
- **`/booking` (Entry Point Reservasi)**:
  - Rute persiapan transisi menuju Phase 05 Booking Engine.
  - Memvalidasi parameter `?service={id}` terhadap basis data dan menampilkan kartu ringkasan layanan.
  - Pesan transisi transparan mengenai persiapan sistem reservasi online mandiri.
  - Opsi konsultasi / reservasi langsung melalui WhatsApp.

---

## 2. Komponen Tata Letak Reusable (`src/components/public/`)

1. **`PublicHeader`**: Navigasi sticky desktop & drawer sheet responsif di mobile dengan tautan aktif dan CTA "Booking Sekarang".
2. **`PublicFooter`**: Informasi legal usaha, alamat, kontak, ringkasan jam kerja mingguan, dan hak cipta.
3. **`FloatingWhatsAppButton`**: Tombol aksi melayang di sudut kanan bawah layar dengan efek visual lembut dan teks pembuka otomatis yang di-encode aman.
4. **`ServiceCard`**: Kartu representasi layanan dengan thumbnail, badge kategori, harga Rupiah, dan durasi.
5. **`GalleryLightbox`**: Modal penampil foto resolusi tinggi dengan navigasi sentuh/keyboard.
6. **`OperatingHoursTable`**: Tabel jadwal 7 hari dengan indikator status buka/tutup *real-time* berbasis timezone `Asia/Jakarta`.

---

## 3. Akses Media MinIO Publik yang Aman

- Kredensial dan endpoint internal MinIO **tidak pernah** diekspos ke klien peramban.
- Seluruh berkas gambar (logo, thumbnail layanan, foto galeri) dilayani melalui streaming proxy terverifikasi di:
  `GET /api/media/[...key]`
- Endpoint memverifikasi ekstensi dan prefix folder yang diizinkan (`business/logos/`, `services/images/`, `gallery/images/`) serta menerapkan cache headers `public, max-age=86400, stale-while-revalidate=3600`.
