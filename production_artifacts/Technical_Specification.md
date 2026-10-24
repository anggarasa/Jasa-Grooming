# Spesifikasi Teknis: Redesign Menyeluruh UI Berdasarkan Referensi Gambar & Font Plus Jakarta Sans

> **Penyusun**: Product Manager & Lead Architect (`@pm`)  
> **Status**: Menunggu Persetujuan User  
> **Tanggal**: 2026-10-24  
> **Target Proyek**: TampilKit Booking (PawCare Grooming / Studio & Spa)

---

## 1. Ringkasan Eksekutif
Pembaruan menyeluruh antarmuka pengguna (UI/UX) di seluruh aplikasi — mulai dari halaman publik (Beranda, Katalog Layanan, Galeri, Booking Wizard) hingga portal login dan Dashboard Admin — mengadopsi bahasa desain visual modern minimalis berstandar internasional sesuai gambar referensi pengguna. Siklus ini menerapkan:
1. **Tipografi Global**: Menggunakan **Plus Jakarta Sans** (`next/font/google`) untuk seluruh teks antarmuka publik dan dashboard.
2. **Hero Section Scandinavian Boutique**: Latar belakang bernuansa mineral sage lembut (`#B4C4B9` / `#2D3E33`), teks display kapital putih tebal, kolom pencarian pil putih (`rounded-full`), filter kategori kapsul, social proof avatar stack, serta floating badge garansi/keaslian.
3. **Card Layanan & Koleksi Kategori**: Desain kartu ber-radius besar (`rounded-3xl` / 24-28px) dengan foto bersih, label status kapsul, harga berbobot tegas, dan tombol aksi bulat hitam.
4. **Bilah Aksi & Banner Promo Kapsul**: Banner penawaran/newsletter dengan input pil dan tombol kapsul hitam pekat.
5. **Penyelarasan Dashboard Admin**: Peremajaan Sidebar, TopNav, KPI cards, dan tabel reservasi dengan estetika Plus Jakarta Sans yang bersih, terstruktur, dan modern.

---

## 2. Analisis Referensi Desain Visual (Gambar Pengguna)

Berdasarkan aset visual yang diunggah (`media_1792809254267_916ee69e.png`), elemen-elemen kunci yang diadopsi adalah:
- **Navbar**: Berada di atas latar belakang mineral sage, logo tipografi tegas di kiri, navigasi teks kecil kapital di tengah, tombol profil kapsul dan tombol aksi utama hitam (`rounded-full`) di kanan.
- **Hero Title**: Teks display kapital tebal putih: *"SEMUA UNTUK ANABUL KESAYANGAN: PERAWATAN, KENYAMANAN & KASIH SAYANG"*.
- **Search & Quick Filters**: Kolom pencarian pil putih dengan tombol pencarian lingkaran hitam, di bawahnya terdapat deretan kapsul filter kategori (Full Grooming, Basic Bath, Styling, Spa, Medicated).
- **Social Proof**: Badge kapsul melengkung berisi tumpukan foto pelanggan + bintang kepuasan (5/5) + teks *"10.000+ Pelanggan Bahagia"*.
- **Hero Floating Badge (Kanan)**: Kartu putih melayang di samping visual hewan peliharaan, menyajikan 3 poin keunggulan (100% Produk Organik, Layanan Cepat Tepat Waktu, Bebas Stres).
- **Layanan Terpopuler**: Grid kartu putih (`rounded-3xl`) dengan badge kecil di pojok kiri atas (mis. "Favorit" / "Baru"), foto bersih, nama layanan tebal, deskripsi singkat, tarif tebal, dan tombol aksi melingkar.
- **Kategori Perawatan**: Kartu foto bersudut melengkung halus dengan floating icon badge di tengah bawah foto, nama kategori tebal, deskripsi, dan teks tautan aksi.
- **Banner Promo Kapsul**: Kotak banner abu-abu kehijauan lembut melengkung (`rounded-3xl`) dengan ikon email melingkar, ajakan langganan/promo, input email pil, dan tombol hitam pekat.
- **Footer Minimalis Terang**: Latar belakang putih/abu-abu terang dengan logo brand, ringkasan, tautan terstruktur, nomor kontak berukuran besar, jam operasional, dan hak cipta.

---

## 3. Kebutuhan Fungsional & Komponen yang Dimodifikasi

### A. Tipografi & Fondasi
- Integrasi `Plus_Jakarta_Sans` dari `next/font/google` di `src/app/layout.tsx`.
- Konfigurasi variabel font `--font-plus-jakarta-sans` di `src/app/globals.css` sebagai font keluarga default antarmuka.

### B. Halaman Publik
1. **`src/components/public/PublicHeader.tsx`**:
   - Latar belakang mineral sage lembut dengan integrasi BrandLogo.
   - Tombol "Masuk / Akun" berbentuk kapsul (`rounded-full`) dan tombol "Booking Sekarang" berupa tombol kapsul hitam solid (`bg-black text-white rounded-full`).
2. **`src/app/(public)/page.tsx` (Beranda & Hero)**:
   - Hero Section dengan palette mineral sage (`#B4C4B9` / `#A5B8AA`), display text kapital putih Plus Jakarta Sans, search bar kapsul, category pills, rating trust badge, visual hewan peliharaan, dan floating feature card.
   - Section "Layanan Terpopuler" dengan tombol navigasi panah melingkar (`<` dan `>`) dan kartu ber-radius `rounded-3xl`.
   - Section "Kategori Perawatan" dengan kartu foto bernuansa boutique.
   - Banner newsletter & info promo berbentuk kapsul (`rounded-3xl`).
3. **`src/components/public/PublicFooter.tsx`**:
   - Footer terang minimalis dengan background bersih (`#FAFBF9`), tata letak 4 kolom informatif, kontak telepon besar, dan hak cipta.
4. **`src/components/public/ServiceCard.tsx`**:
   - Diperbarui menjadi kartu bergaya modern dengan badge status kapsul, harga tebal, dan tombol booking melingkar hitam.
5. **`src/components/booking/*`**:
   - Modernisasi step wizard dan date/time slot picker agar selaras dengan estetika kapsul dan Plus Jakarta Sans.

### C. Portal Login & Dashboard Admin
1. **`src/components/auth/LoginForm.tsx`**:
   - Kartu login modern `rounded-3xl` berlatar belakang bersih dengan tombol submit kapsul hitam tegas.
2. **`src/components/dashboard/DashboardSidebar.tsx` & `DashboardTopNav.tsx`**:
   - Penyesuaian font Plus Jakarta Sans, tombol aksi kapsul, status badge bulat halus, dan card metrik dengan tipografi yang jernih.

---

## 4. Kebutuhan Non-Fungsional
- **Performa Visual (CLS 0)**: Penggunaan `next/font/google` menjamin font Plus Jakarta Sans di-preload di server tanpa flicker atau lonjakan tata letak.
- **Kontras Aksesibilitas (WCAG AA)**: Seluruh teks pada tombol kapsul hitam memiliki rasio kontras 21:1 terhadap putih. Teks pada hero dioptimalkan dengan kontras tinggi yang mudah dibaca.
- **Ketahanan Sistem**: Seluruh 355 unit & integration test dipastikan tetap lolos 100%.

---

## 5. Rencana Eksekusi Alur Kerja Tim
1. **`@pm`** (Dokumen Spesifikasi ini) ➔ Menunggu persetujuan user.
2. **`@designer`** ➔ Merumuskan `Design_System.md` dan `design-tokens.json` dengan palet warna Mineral Sage, Pure Black, Pure White, dan font Plus Jakarta Sans.
3. **`@frontend`** ➔ Menerapkan font Plus Jakarta Sans, memperbarui `globals.css`, memodernisasi `PublicHeader`, `PublicFooter`, `page.tsx`, `ServiceCard`, `LoginForm`, dan komponen Dashboard.
4. **`@qa`** ➔ Melakukan audit visual, kontras WCAG AA, dan menjalankan test suite `npm run typecheck`, `npm run lint`, `npm run test`.
5. **`@devops`** ➔ Memverifikasi server aktif di port 3000 dan dapat diakses dengan mulus.
6. **`@curator`** ➔ Memperbarui Section B knowledge base dengan pelajaran desain kapsul modern dan integrasi font kustom.
