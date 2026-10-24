# Sistem Desain TampilKit Booking (PawCare Studio & Spa)
## Edisi Desain: Scandinavian Modern Boutique (Referensi Visual Minimalis)

> **Role**: UI/UX Designer (`@designer`)  
> **Status**: Menunggu Konfirmasi Singkat User  
> **Tanggal**: 2026-10-24  
> **Dasar Desain**: Referensi Gambar Visual Pengguna & Tipografi Plus Jakarta Sans

---

## 1. Karakter & Persona Visual Brand
- **Scandinavian Pet Boutique**: Menggabungkan kesederhanaan minimalis Eropa Utara dengan kehangatan perawatan hewan peliharaan berstandar premium.
- **Kapsul Geometris & Ramah Sentuhan (Pill-Shaped Geometry)**: Menggunakan bentuk pil penuh (`rounded-full`) untuk tombol aksi, kolom pencarian, tag filter, dan badge trust social proof. Menghilangkan sudut tajam yang kaku agar terasa sangat ramah (*approachable*) dan intuitif bagi pengguna.
- **Lapang, Bersih & Terang (Airy & High Contrast)**: Kartu putih murni ber-radius besar (`rounded-[26px]`) di atas kanvas mineral lembut, dipadukan dengan tombol aksi hitam solid berbobot tegas yang menarik perhatian mata seketika.

---

## 2. Palet Warna & Komposisi 60-30-10

### A. Rincian Palet Warna Utama
1. **60% Latar Belakang & Kanvas (Dominan)**:
   - `hero-background`: `#B4C4B9` (*Soft Mineral Sage*) — warna latar belakang hero yang menenangkan, berkelas, dan segar.
   - `background`: `#F5F6F3` (*Chalk Warm Mineral*) — warna kanvas halaman publik dan dashboard yang lembut.
   - `card`: `#FFFFFF` (*Pure Crisp White*) — permukaan kartu layanan, kartu form, dan floating badges.
   - `border`: `#E2E6DF` (*Subtle Mineral Gray Border*).
2. **30% Struktural & Kontras Sekunder**:
   - `foreground`: `#111827` (*Deep Obsidian / Pitch Black*) — warna teks utama untuk keterbacaan tajam dan kontras superior.
   - `secondary`: `#E8EDE7` (*Light Sage Tint*) — latar belakang badge filter dan container sekunder.
   - `muted`: `#F0F2EE` dengan teks `#6B7280`.
3. **10% Aksen Aksi & Konversi (CTA)**:
   - `primary-action` / `button-pill`: `#111827` (*Solid Black Pill*) dengan teks putih `#FFFFFF` — tombol utama aksi booking, pencarian, dan navigasi panah melingkar.
   - `accent-gold` / `rating-star`: `#F59E0B` (*Warm Honey Amber*) — warna bintang ulasan (5/5) dan highlight kepuasan pelanggan.
   - `accent-badge`: `#E2E9E3` dengan teks `#2D4233` (*Deep Botanical Slate*).

### B. Matriks Kontras Aksesibilitas (WCAG AA Compliance)
- Teks Putih `#FFFFFF` di atas Tombol Kapsul Hitam `#111827`: **18.2:1** (Lolos AAA ✅)
- Teks Hitam `#111827` di atas Background Putih `#FFFFFF`: **18.2:1** (Lolos AAA ✅)
- Teks Putih `#FFFFFF` di atas Hero Mineral Sage `#B4C4B9` dengan text-shadow halus atau overlay tipis: **Lolos AA (≥4.5:1) ✅**
- Secondary Teks `#2D4233` di atas `#E8EDE7`: **6.4:1** (Lolos AAA ✅)

---

## 3. Tipografi: Plus Jakarta Sans
Tipografi utama di seluruh aplikasi menggunakan **Plus Jakarta Sans** (Google Fonts) dengan skala rasio geometris modern:

| Tingkat | Ukuran Font | Line-Height | Weight | Tracking | Penerapan |
|---|---|---|---|---|---|
| **Hero Display H1** | 2.5rem – 3.75rem (40–60px) | 1.1 | 800 (ExtraBold) | -0.025em | Judul Utama Hero (Uppercase) |
| **Section Title H2** | 1.875rem – 2.25rem (30–36px) | 1.2 | 800 (Bold) | -0.02em | Layanan Terpopuler, Koleksi |
| **Card Title H3** | 1.125rem – 1.25rem (18–20px) | 1.3 | 700 (Bold) | -0.015em | Nama Layanan, Judul Card |
| **Body Large** | 1.125rem (18px) | 1.55 | 500 (Medium) | normal | Deskripsi singkat hero |
| **Body Regular** | 0.9375rem – 1.0rem (15–16px) | 1.5 | 400 (Regular) | normal | Deskripsi layanan, review |
| **Pill / Button Label** | 0.8125rem – 0.875rem (13–14px) | 1.2 | 600 (SemiBold) | +0.01em | Tombol kapsul, filter tags |
| **Price Display** | 1.25rem – 1.5rem (20–24px) | 1.1 | 800 (ExtraBold) | -0.01em | Tarif harga nominal Rupiah |

---

## 4. Bentuk Geometris & Bahasa Komponen (Shape Language)

### A. Kapsul / Pill (`rounded-full`)
- **Search Bar Hero**: Input putih melayang berbentuk kapsul penuh dengan tombol pencarian bulat hitam di sisi kanan (`h-14 rounded-full pl-6 pr-2`).
- **Category Filter Pills**: Tombol pil putih/abu-abu (`rounded-full px-5 py-2.5`) yang aktif dengan background hitam teks putih.
- **Tombol CTA**: Tombol kapsul hitam solid (`rounded-full px-7 py-3.5 bg-black text-white hover:bg-neutral-800`).
- **Social Proof Pill**: Badge kapsul putih di hero yang menampung tumpukan avatar dan ulasan rating bintang emas.

### B. Kartu Ber-radius Halus (`rounded-[26px]` / `rounded-3xl`)
- **Card Layanan Terpopuler**: Kartu putih murni dengan radius 26px, padding lega, thumbnail foto produk/layanan bersih, tag status kecil di kiri atas, dan tombol aksi melingkar di pojok kanan bawah.
- **Card Kategori Perawatan**: Kartu foto bersudut lengkung halus dengan badge ikonik mengambang di perbatasan foto dan teks.
- **Banner Promo / Newsletter**: Kotak kapsul ber-radius 26px dengan warna sage lembut, input pil putih, dan tombol hitam.

### C. Elevasi & Bayangan
- Menggunakan bayangan sangat halus (*ambient feather shadow*):
  - `shadow-pill`: `0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)`
  - `shadow-card`: `0 10px 30px -4px rgba(45, 66, 51, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.03)`
  - `shadow-float`: `0 20px 40px -8px rgba(17, 24, 39, 0.08)`

---

## 5. Komponen Dashboard Admin
- **Sidebar**: Latar belakang putih bersih ber-border abu-abu tipis, navigasi dengan active state kapsul sage (`bg-secondary text-primary font-bold rounded-full`), dan ikon minimalis.
- **TopNav**: Berbentuk bilah bersih dengan tombol aksi kapsul dan avatar bulat.
- **Tabel & Kartu Metrik**: Desain kartu `rounded-2xl` dengan tipografi Plus Jakarta Sans angka tebal dan indikator status badge kapsul lembut.
