# Dokumentasi Manajemen Layanan: Phase 03

Dokumen ini menjelaskan pengelolaan katalog layanan, kategori, format keuangan desimal, dan kebijakan penghapusan aman (*safe deletion*) pada **TampilKit Booking**.

---

## 1. Kategori Layanan (`/dashboard/services/categories`)

Kategori berfungsi mengelompokkan menu layanan grooming (misal: *Basic Grooming*, *Full Grooming*, *Premium Treatment*).

### Model Data Prisma (`ServiceCategory`)
- `id`: CUID identifier unik.
- `businessId`: Relasi ke bisnis pemilik.
- `name`: Nama kategori.
- `slug`: Identifier URL unik dalam cakupan bisnis (`@@unique([businessId, slug])`).
- `description`: Penjelasan kategori (opsional).
- `displayOrder`: Urutan tampilan numerik.
- `isActive`: Status aktif kategori.

### Kebijakan Penghapusan Kategori (*Safe Deletion*)
- Kategori yang masih memiliki relasi layanan aktif atau riwayat booking tidak dapat dihapus permanen (*hard delete*).
- Sistem menerapkan **Safe Deactivation** (`isActive = false`) otomatis dengan memberi peringatan informatif kepada pengguna, menjaga integritas relasi basis data.

---

## 2. Katalog Layanan Grooming (`/dashboard/services`)

### Model Data Prisma (`Service`)
- `name`: Nama layanan (misal: Basic Bath, Full Grooming, Premium Spa).
- `slug`: Identifier unik per bisnis (`@@unique([businessId, slug])`).
- `categoryId`: Relasi kategori induk.
- `shortDescription`, `fullDescription`: Rincian deskripsi manfaat layanan.
- `price`: Nilai moneter presisi tinggi menggunakan tipe data `Decimal` (`@db.Decimal(12, 2)`).
- `durationMinutes`: Durasi waktu pengerjaan layanan dalam menit.
- `bufferMinutes`: Waktu jeda tambahan khusus layanan ini.
- `imageObjectKey`: Kunci objek foto layanan tersimpan di MinIO S3 (`services/images/{uuid}.webp`).
- `displayOrder`: Urutan tampilan katalog.
- `isActive`: Sakelar ketersediaan layanan untuk reservasi.

### Representasi Moneter & IDR
- Seluruh harga disimpan sebagai tipe basis data `Decimal` untuk mencegah *floating point precision error* JavaScript.
- Nilai harga diformat ke Rupiah (`Rp65.000`, `Rp120.000`, dsb) di layer presentasi dan divalidasi tidak boleh bernilai negatif.

### Siklus Hidup & Penghapusan Layanan
- Layanan yang telah terikat dengan data reservasi historis (`Booking`) dilindungi dari penghapusan permanen.
- Jika pengguna meminta penghapusan, sistem secara otomatis menjalankan *Soft Delete* dengan mengubah `isActive = false`, sehingga catatan transaksi dan laporan keuangan masa lalu tetap valid.
