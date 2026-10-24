# Panduan Penggunaan dan Alur Sistem — PawCare Grooming
## TampilKit Booking Platform (Modular Monolith)

Dokumen ini merupakan panduan komprehensif mengenai **alur kerja sistem (*system workflow*)** dan **tata cara penggunaan aplikasi (*user manual*)** untuk seluruh pengguna, baik pengunjung publik (pelanggan/pemilik anabul), pengelola bisnis (*Owner* & Staf Salon), maupun pengembang (*developer*).

---

## Daftar Isi
1. [Ikhtisar Arsitektur & Alur Sistem](#1-ikhtisar-arsitektur--alur-sistem)
2. [Alur Pelanggan (Customer Journey)](#2-alur-pelanggan-customer-journey)
   - [2.1 Menjelajahi Website Publik](#21-menjelajahi-website-publik)
   - [2.2 Melakukan Reservasi Baru (Booking Wizard)](#22-melakukan-reservasi-baru-booking-wizard)
   - [2.3 Halaman Konfirmasi & Penyimpanan Akses](#23-halaman-konfirmasi--penyimpanan-akses)
   - [2.4 Manajemen Reservasi Mandiri oleh Pelanggan](#24-manajemen-reservasi-mandiri-oleh-pelanggan)
3. [Alur Pemilik & Admin (Owner & Staff Dashboard)](#3-alur-pemilik--admin-owner--staff-dashboard)
   - [3.1 Akses Portal Masuk (Login)](#31-akses-portal-masuk-login)
   - [3.2 Ringkasan Dashboard & KPI Harian](#32-ringkasan-dashboard--kpi-harian)
   - [3.3 Manajemen Reservasi & State Machine Status](#33-manajemen-reservasi--state-machine-status)
   - [3.4 Kalender Janji Temu & Walk-In Booking](#34-kalender-janji-temu--walk-in-booking)
   - [3.5 Pemblokiran Waktu Stasiun (Resource Blocking)](#35-pemblokiran-waktu-stasiun-resource-blocking)
   - [3.6 Katalog Layanan & Kategori Perawatan](#36-katalog-layanan--kategori-perawatan)
   - [3.7 Pengaturan Jam Operasional & Istirahat (Multi-Break)](#37-pengaturan-jam-operasional--istirahat-multi-break)
   - [3.8 Pengaturan Aturan Reservasi](#38-pengaturan-aturan-reservasi)
   - [3.9 Galeri Foto & Pengelolaan Media MinIO](#39-galeri-foto--pengelolaan-media-minio)
   - [3.10 Integrasi Google Calendar Dua Arah](#310-integrasi-google-calendar-dua-arah)
4. [Panduan Operasional & Eksekusi Pengembang (DevOps)](#4-panduan-operasional--eksekusi-pengembang-devops)
   - [4.1 Prasyarat Perangkat Lunak](#41-prasyarat-perangkat-lunak)
   - [4.2 Konfigurasi Environment Variable](#42-konfigurasi-environment-variable)
   - [4.3 Inisialisasi Database & Seeding Data Real](#43-inisialisasi-database--seeding-data-real)
   - [4.4 Menjalankan Server Pengembangan](#44-menjalankan-server-pengembangan)
   - [4.5 Menjalankan Background Worker Kalender](#45-menjalankan-background-worker-kalender)
   - [4.6 Menjalankan Pengujian Otomatis (Test Suite)](#46-menjalankan-pengujian-otomatis-test-suite)
5. [Tabel Referensi Akun & Data Dummy](#5-tabel-referensi-akun--data-dummy)

---

## 1. Ikhtisar Arsitektur & Alur Sistem

Sistem PawCare Grooming dibangun di atas arsitektur *modular monolith* dengan pemisahan peran yang tegas antara antarmuka publik dan dashboard admin. Diagram di bawah mengilustrasikan interaksi menyeluruh antara pelanggan, mesin reservasi, basis data PostgreSQL, media storage MinIO, serta Google Calendar:

```mermaid
flowchart TD
    subgraph Pelanggan["Pelanggan Publik"]
        A["Buka Website (/)"] --> B["Pilih Layanan & Jadwal (/booking)"]
        B --> C["Kirim Reservasi"]
        C --> D["Terima Kode Booking & Token Rahasia"]
        D --> E["Cek/Ubah Janji Temu (/booking/manage)"]
    end

    subgraph CoreEngine["Availability & Booking Engine"]
        C --> F{"Advisory Lock PostgreSQL & Validasi Slot"}
        F -->|Slot Tersedia| G["Simpan Booking & Snapshot Biaya"]
        F -->|Konflik / Penuh| H["Kembalikan Error 409 Conflict"]
        G --> I["Enqueue Event ke Outbox Worker"]
    end

    subgraph GoogleIntegration["Integrasi Google Calendar"]
        I --> J["Outbox Worker (Background Job)"]
        J --> K["Google Calendar API (Insert Event)"]
        K -.->|FreeBusy Check| F
    end

    subgraph AdminDashboard["Dashboard Pemilik & Staf (/dashboard)"]
        L["Login (/login)"] --> M["Overview & KPI Bisnis"]
        M --> N["Update Status Booking (State Machine)"]
        M --> O["Input Walk-In Booking"]
        M --> P["Blokir Jam Stasiun (Resource Block)"]
        M --> Q["Atur Layanan, Jam Buka, & Galeri"]
        N --> I
        P --> I
    end

    G --> Database[("PostgreSQL Database")]
    Q --> MinIO[("MinIO S3 Object Storage")]
```

---

## 2. Alur Pelanggan (Customer Journey)

### 2.1 Menjelajahi Website Publik
1. **Halaman Utama (`/`)**:
   - Menampilkan identitas visual modern anabul dengan tipografi **Plus Jakarta Sans**, warna mineral sage lembut, dan kartu berujung membulat.
   - Terdapat ringkasan fasilitas salon, keunggulan higienitas, dan ulasan pelanggan.
   - Bilah pencarian cepat dan filter kategori (Kucing, Anjing, Khusus) untuk mempermudah navigasi.
2. **Katalog Layanan (`/services`)**:
   - Menampilkan seluruh paket perawatan lengkap dengan durasi menit, buffer waktu, dan harga dalam format Rupiah (IDR).
   - Pengunjung dapat melihat deskripsi detail dari setiap paket perawatan (contoh: *Basic Cat Grooming*, *Cat Spa & Treatment*, *Styling Anjing*).
3. **Galeri Salon (`/gallery`)**:
   - Menampilkan foto real dokumentasi area salon, meja grooming hidrolik ber-AC, proses mandi spa, dan hasil potong rambut anabul.
4. **Kontak & WhatsApp Floating Button**:
   - Terintegrasi dengan tombol bantuan WhatsApp di pojok kanan bawah untuk konsultasi langsung dengan staf salon.

---

### 2.2 Melakukan Reservasi Baru (Booking Wizard)
Pelanggan dapat menekan tombol **"Booking Sekarang"** pada navigasi atau kartu layanan untuk masuk ke halaman alur pemesanan interaktif di `/booking`.

```mermaid
flowchart LR
    S1["1. Pilih Layanan"] --> S2["2. Pilih Waktu"]
    S2 --> S3["3. Data Pemilik & Anabul"]
    S3 --> S4["4. Konfirmasi & Booking"]
```

1. **Langkah 1: Pemilihan Layanan & Stasiun**:
   - Pelanggan memilih jenis hewan dan kategori layanan yang diinginkan.
   - Sistem otomatis mengaitkan dengan stasiun grooming yang tersedia (*Main Grooming Station*).
2. **Langkah 2: Pemilihan Tanggal & Waktu**:
   - Kalender hanya mengaktifkan tanggal operasional salon (maksimal 30 hari ke depan).
   - Sistem secara otomatis memanggil API ketersediaan (`/api/availability`).
   - Slot jam yang tampil dihitung secara dinamis berdasarkan jam kerja, waktu istirahat salon, durasi layanan, waktu buffer pembersihan meja, reservasi yang sudah ada, dan kesibukan Google Calendar.
   - Slot yang bentrok akan berstatus abu-abu (*disabled*) sehingga mencegah salah pilih.
3. **Langkah 3: Pengisian Data Pemilik & Anabul**:
   - **Data Pemilik**: Nama lengkap, nomor WhatsApp aktif (wajib), dan email (opsional).
   - **Data Anabul**: Nama anabul, jenis (Kucing/Anjing), ras, usia, dan catatan khusus (misal: "sensitif air dingin" atau "takut suara hairdryer").
4. **Langkah 4: Review & Finalisasi**:
   - Rangkuman total biaya dengan rincian durasi dan waktu selesai.
   - Proteksi idempotensi aktif untuk mencegah pemesanan ganda jika tombol ditekan berulang kali secara tidak sengaja.
   - Menggunakan *PostgreSQL Advisory Lock* guna memastikan tidak ada dua pelanggan yang dapat memesan slot yang sama pada detik yang bersamaan.

---

### 2.3 Halaman Konfirmasi & Penyimpanan Akses
Setelah reservasi sukses dibuat:
1. Pelanggan otomatis diarahkan ke halaman `/booking/confirmation`.
2. Halaman menampilkan:
   - **Kode Booking Unik** (contoh: `BK-PAW-0001` atau `GRM-20261112-L79Q`).
   - Rincian jadwal tanggal, jam mulai, dan perkiraan selesai.
   - Nama anabul dan paket perawatan yang dipilih.
   - Total tarif yang harus dibayarkan di salon.
   - **Tautan Khusus Pengelolaan Tamu** yang berisi token rahasia (*Guest Access Token* berenkripsi SHA-256).
3. Pelanggan dapat menyalin tautan pengelolaan atau menyimpannya untuk melihat status perawatan anabul tanpa perlu mendaftar akun/kata sandi.

---

### 2.4 Manajemen Reservasi Mandiri oleh Pelanggan
Melalui tautan `/booking/manage?code=...&token=...`:
1. **Pengecekan Status Real-Time**:
   - Pelanggan dapat memantau status pesanan: `CONFIRMED` (Dikonfirmasi), `IN_PROGRESS` (Sedang Grooming), `COMPLETED` (Selesai), atau `CANCELLED` (Dibatalkan).
2. **Reschedule Mandiri (Pindah Jadwal)**:
   - Jika salon mengizinkan fitur reschedule pada pengaturan bisnis, pelanggan dapat memilih tanggal dan jam baru yang masih tersedia.
3. **Pembatalan Mandiri**:
   - Pelanggan dapat membatalkan janji temu secara mandiri selama masih berada di luar jendela pembatalan minimal (*cancellation window*, default 2 jam sebelum jadwal).

---

## 3. Alur Pemilik & Admin (Owner & Staff Dashboard)

### 3.1 Akses Portal Masuk (Login)
1. Buka halaman [http://localhost:3000/login](http://localhost:3000/login).
2. Terdapat formulir login standar dengan proteksi *rate-limiting* (maksimal 5 percobaan gagal per IP/email) dan enkripsi kata sandi *Argon2id*.
3. **Fitur Cepat User Dummy**:
   - Untuk mempermudah demonstrasi dan operasional harian, klik tombol **"Masuk dengan User Dummy (Owner)"**.
   - Sistem akan otomatis mengisi email `owner@pawcare.id`, kata sandi `Password123!`, dan langsung mengautentikasi sesi Anda ke dashboard.

---

### 3.2 Ringkasan Dashboard & KPI Harian
Setelah berhasil login, Anda akan diarahkan ke `/dashboard`:
- **Kartu Metrik Utama (KPI)**:
  - Total reservasi hari ini.
  - Jumlah anabul yang sedang dalam perawatan aktif (*In-Progress*).
  - Janji temu yang menunggu giliran (*Confirmed*).
  - Estimasi omset harian.
- **Jadwal Antrean Hari Ini**:
  - Daftar anabul yang dijadwalkan hadir hari ini diurutkan berdasarkan jam mulai.
  - Aksi cepat untuk memulai perawatan atau menghubungi pemilik via WhatsApp.

---

### 3.3 Manajemen Reservasi & State Machine Status
Pada menu **Pemesanan** (`/dashboard/bookings`):
1. **Tabel Master Pemesanan**:
   - Dilengkapi pencarian nama pelanggan, nomor HP, nama anabul, serta filter berdasarkan rentang tanggal dan status.
   - Menampilkan snapshot harga dan durasi pada saat booking dibuat (sehingga jika tarif layanan di masa depan naik, riwayat pembayaran lama tetap akurat).
2. **Alur Transisi Status (State Machine)**:
   Perubahan status dilindungi oleh aturan ketat untuk menjaga integritas data:
   - `PENDING` ➔ `CONFIRMED` (Diterima oleh salon)
   - `CONFIRMED` ➔ `IN_PROGRESS` (Anabul tiba dan mulai dimandikan/digrooming)
   - `IN_PROGRESS` ➔ `COMPLETED` (Grooming selesai, anabul siap dijemput)
   - `CONFIRMED` / `PENDING` ➔ `CANCELLED` (Wajib menyertakan alasan pembatalan)
   - `CONFIRMED` ➔ `NO_SHOW` (Pelanggan tidak hadir tanpa pemberitahuan)

---

### 3.4 Kalender Janji Temu & Walk-In Booking
Pada menu **Kalender** (`/dashboard/calendar`):
1. **Tampilan Jadwal Interaktif**:
   - Mendukung tampilan Harian (*Day*), Mingguan (*Week*), dan Bulanan (*Month*).
   - Setiap kartu janji temu diberi kode warna sesuai status pengerjaan.
   - Waktu istirahat salon dan jadwal pemblokiran stasiun ditampilkan dengan pola arsiran (*striped pattern*) agar staf tidak salah menjadwalkan.
2. **Pemesanan Langsung (Walk-In Booking Wizard)**:
   - Jika ada pelanggan yang datang langsung membawa anabul tanpa booking online sebelumnya, klik tombol **"Tambah Walk-In"**.
   - Isi nama pelanggan, no telepon, data anabul, dan pilih layanan. Staf dapat langsung menetapkan slot jam saat itu juga.

---

### 3.5 Pemblokiran Waktu Stasiun (Resource Blocking)
Pada menu **Blokir Waktu** (`/dashboard/resources` atau via Kalender):
1. Digunakan ketika meja grooming atau stasiun perawatan tidak dapat beroperasi (contoh: pembersihan menyeluruh, disinfeksi kutu, perbaikan blower/meja hidrolik, atau rapat staf).
2. Tentukan stasiun yang diblokir, waktu mulai, waktu selesai, dan alasan penutupan.
3. Selama waktu tersebut aktif:
   - Mesin ketersediaan (*Availability Engine*) otomatis menutup slot tersebut dari website publik.
   - Pemblokiran langsung disinkronkan ke Google Calendar sebagai event sibuk (*busy*).

---

### 3.6 Katalog Layanan & Kategori Perawatan
Pada menu **Layanan & Kategori** (`/dashboard/services`):
1. **Manajemen Kategori**:
   - Buat atau ubah kategori seperti "Perawatan Kucing", "Perawatan Anjing", atau "Treatment Medis & Kutu".
2. **Manajemen Layanan**:
   - Tentukan Nama Paket, Slug, dan Deskripsi lengkap.
   - **Durasi Layanan**: Waktu pengerjaan grooming dalam menit (misal 60 menit).
   - **Buffer Time**: Waktu jeda setelah perawatan selesai untuk sterilisasi meja dan persiapan anabul berikutnya (misal 15 menit).
   - **Tarif Layanan**: Harga dalam Rupiah (disimpan dengan presisi tinggi di database).
   - **Upload Gambar Layanan**: Unggah foto paket perawatan yang akan langsung disimpan ke MinIO S3 dan tampil di katalog publik.

---

### 3.7 Pengaturan Jam Operasional & Istirahat (Multi-Break)
Pada menu **Pengaturan ➔ Jam Operasional** (`/dashboard/settings/operating-hours`):
1. Tentukan status buka/tutup untuk setiap hari dalam seminggu (Senin s.d. Minggu).
2. Atur jam operasional toko (contoh: buka pukul `09:00` dan tutup pukul `17:00`).
3. **Dukungan Multi-Break (Jam Istirahat)**:
   - Anda dapat menambahkan jam istirahat lebih dari satu sesi dalam sehari (misalnya: Istirahat Siang pukul `12:00 - 13:00` dan Istirahat Sore pukul `15:30 - 16:00`).
   - Slot reservasi otomatis tidak akan tersedia pada rentang waktu istirahat ini.

---

### 3.8 Pengaturan Aturan Reservasi
Pada menu **Pengaturan ➔ Aturan Reservasi** (`/dashboard/settings/booking`):
1. **Booking Interval**: Interval waktu mulai antar slot (misal setiap 30 menit atau 45 menit).
2. **Default Buffer**: Buffer waktu pembersihan standar antar sesi.
3. **Minimum Advance Time**: Waktu minimum sebelum janji temu dibuat (contoh: 60 menit, mencegah booking mendadak 5 menit sebelum jam kerja).
4. **Maximum Advance Days**: Batas hari maksimal pelanggan dapat memesan ke depan (default: 30 hari).
5. **Cancellation Window**: Batas waktu minimal pembatalan janji temu (contoh: 2 jam sebelum acara).
6. **Auto Confirm Booking**: Aktifkan jika ingin setiap pesanan yang masuk langsung berstatus `CONFIRMED` tanpa perlu persetujuan manual staf.

---

### 3.9 Galeri Foto & Pengelolaan Media MinIO
Pada menu **Pengaturan ➔ Galeri & Logo** (`/dashboard/settings/gallery`):
1. Unggah logo salon untuk branding header publik dan email tanda terima.
2. Unggah foto-foto dokumentasi fasilitas dan anabul ceria.
3. Setiap file yang diunggah melewati validasi ketat di sisi server:
   - Pengecekan ukuran file maksimal (5MB).
   - Pengecekan ekstensi gambar aman (`.webp`, `.jpg`, `.png`).
   - **Verifikasi Magic Bytes**: Membaca byte awal file biner asli untuk memastikan file bukan script berbahaya yang disamarkan.
4. Terintegrasi fallback lokal otomatis sehingga gambar tetap tampil mulus meskipun container MinIO sedang dalam proses pemeliharaan.

---

### 3.10 Integrasi Google Calendar Dua Arah
Pada menu **Pengaturan ➔ Integrasi Kalender** (`/dashboard/settings/integrations`):
1. **Koneksi Akun (OAuth 2.0 PKCE)**:
   - Klik tombol **"Hubungkan Google Calendar"**.
   - Masuk menggunakan akun Google salon dan berikan izin kalender.
   - Token OAuth disimpan dalam basis data menggunakan enkripsi **AES-256-GCM**.
2. **Sinkronisasi Dua Arah (*Bidirectional Sync*)**:
   - Setiap kali ada booking baru atau perubahan status di PawCare Grooming, sistem mencatat event ke tabel outbox queue.
   - Event otomatis terkirim dan muncul di aplikasi Google Calendar staf/owner di ponsel atau laptop.
3. **Pencegahan Double-Booking (Google FreeBusy Fail-Closed)**:
   - Jika pemilik salon membuat janji temu pribadi langsung di aplikasi Google Calendar miliknya pada jam kerja salon, sistem PawCare Grooming otomatis membaca waktu sibuk tersebut (*FreeBusy check*) dan menutup slot terkait di website publik.
   - Mencegah pelanggan memesan jam saat salon sedang ada agenda eksternal.

---

## 4. Panduan Operasional & Eksekusi Pengembang (DevOps)

### 4.1 Prasyarat Perangkat Lunak
Pastikan perangkat kerja telah terpasang:
- **Node.js**: versi 24 LTS atau lebih baru (`node -v`)
- **npm**: versi 11+ (`npm -v`)
- **PostgreSQL**: port `5432` aktif
- **MinIO Object Storage**: port `9000` (API S3) & `9001` (Console) aktif

---

### 4.2 Konfigurasi Environment Variable
Salin file `.env.example` menjadi `.env.local` dan lengkapi nilainya:
```bash
cp .env.example .env.local
```

Contoh konfigurasi penting di `.env.local`:
```env
NODE_ENV="development"
NEXT_PUBLIC_APP_NAME="PawCare Grooming"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Koneksi PostgreSQL
DATABASE_URL="postgresql://postgres:anggara-sa@localhost:5432/tampilkit_booking?schema=public"

# Kredensial JWT & Enkripsi
JWT_ACCESS_SECRET="ganti-dengan-string-acak-minimal-32-karakter"
JWT_REFRESH_SECRET="ganti-dengan-string-acak-minimal-32-karakter"
ENCRYPTION_KEY="64-karakter-hex-untuk-enkripsi-aes-256-gcm"

# Kredensial MinIO Storage
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="tampilkit-booking"

# Kredensial Google OAuth (Opsional untuk Sync Kalender)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/integrations/google/callback"
```

---

### 4.3 Inisialisasi Database & Seeding Data Real
Jalankan migrasi skema tabel Prisma dan eksekusi seed data bawaan:
```bash
# 1. Jalankan migrasi database
npm run db:migrate

# 2. Isi database dengan data bisnis, layanan real, galeri foto, & akun owner
npm run db:seed
```

> [!NOTE]
> Perintah seed bersifat *idempotent* (dapat dijalankan berulang kali tanpa membuat data duplikat atau merusak relasi).

---

### 4.4 Menjalankan Server Pengembangan
Jalankan server Next.js dengan compiler Turbopack:
```bash
npm run dev
```
Aplikasi dapat diakses melalui browser di:
- Antarmuka Publik: [http://localhost:3000](http://localhost:3000)
- Formulir Reservasi: [http://localhost:3000/booking](http://localhost:3000/booking)
- Portal Masuk: [http://localhost:3000/login](http://localhost:3000/login)
- Dashboard Admin: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

### 4.5 Menjalankan Background Worker Kalender
Jika integrasi Google Calendar diaktifkan, jalankan worker pengolah antrean outbox di terminal terpisah:
```bash
npm run worker:calendar
```
Worker akan memproses setiap mutasi reservasi dan sinkronisasi blokir waktu secara berkala dengan strategi *exponential backoff retry*.

---

### 4.6 Menjalankan Pengujian Otomatis (Test Suite)
Untuk memverifikasi keandalan sistem, integritas transaksi PostgreSQL, keamanan endpoint, dan kompatibilitas komponen UI:
```bash
npm test
```
**Hasil Evaluasi**:
- **47 Test Files** lolos pengujian.
- **356 Tests** lulus 100% (mencakup unit tests, integration tests, concurrency stress test 10 skenario, dan validasi aksesibilitas WCAG).

---

## 5. Tabel Referensi Akun & Data Dummy

Untuk keperluan pengujian lokal, gunakan kredensial berikut:

| Peran Akun | Alamat Email | Kata Sandi | Kegunaan |
| :--- | :--- | :--- | :--- |
| **Owner (Pemilik Salon)** | `owner@pawcare.id` | `Password123!` | Akses penuh dashboard, pengaturan bisnis, jam kerja, katalog, dan Google Calendar. Dapat login 1-klik via tombol dummy di `/login`. |
| **Admin / Staf Groomer** | `admin@pawcare.id` | `Password123!` | Akses operasional harian: kelola reservasi, update status grooming, dan input walk-in. |
| **Pelanggan Dummy** | `budi.santoso@example.com` (HP: `081298765432`) | *Tanpa Password* | Data contoh pelanggan dengan anabul kucing bernama *"Mimi"* (Persia Medium). |

---

> Dokumen ini disusun untuk memastikan transisi operasional yang mulus, pemahaman arsitektur yang komprehensif, dan kemudahan penggunaan aplikasi bagi seluruh pihak yang terlibat. Selamat menggunakan platform **PawCare Grooming**!
