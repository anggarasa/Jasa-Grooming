# Dokumentasi Manajemen Media & MinIO S3: Phase 03

Dokumen ini menjelaskan arsitektur integrasi penyimpanan berkas, validasi keamanan muatan berkas (*magic bytes*), proteksi traversal jalur, dan alur pengambilan media pada **TampilKit Booking**.

---

## 1. Arsitektur Penyimpanan Terisolasi

- **Object Storage**: MinIO S3 terisolasi server-side (`src/lib/minio.ts` & `src/modules/storage/media.service.ts`). Kredensial dan endpoint internal tidak pernah diekspos ke browser pengguna.
- **Struktur Direktori Objek**:
  - `business/logos/{uuid}.webp` — Logo profil bisnis.
  - `services/images/{uuid}.webp` — Foto katalog layanan.
  - `gallery/images/{uuid}.webp` — Foto promosi galeri toko.

---

## 2. Validasi Keamanan Unggahan (OWASP Compliance)

Untuk mencegah serangan *Unrestricted File Upload*, *Remote Code Execution*, dan *Decompression Bombs*, sistem menerapkan validasi berlapis:

1. **Verifikasi Magic Bytes (File Signatures)**:
   - Konten berkas diperiksa berdasarkan *byte signature* awal buffer mentah, bukan semata-mata ekstensi berkas atau header MIME dari browser:
     - **JPEG**: `FF D8 FF`
     - **PNG**: `89 50 4E 47`
     - **WebP**: `52 49 46 46 ... 57 45 42 50`
   - Berkas jenis SVG, HTML, skrip, atau executable otomatis ditolak dengan pesan error `UNSUPPORTED_FILE_TYPE`.
2. **Batasan Ukuran**:
   - Maksimum ukuran berkas adalah **5 MB** per unggahan.
3. **Mitigasi Path Traversal & Penamaan Aman**:
   - Nama berkas asli pengguna tidak pernah digunakan sebagai nama objek S3.
   - Sistem menghasilkan UUID acak unik (`crypto.randomUUID()`) dan membersihkan prefix folder dari karakter berbahaya seperti `..`, `\0`, atau *leading slash*.
4. **Proteksi IDOR Objek**:
   - Permintaan penghapusan berkas memvalidasi kepemilikan objek terhadap `businessId` pengguna yang terotentikasi sebelum menghapus objek dari bucket MinIO.

---

## 3. Alur Pengambilan & Akses Media

Untuk menjaga privasi bucket tanpa membuatnya berstatus publik terbuka (*public-readable bucket*):
- Pengambilan media dilayani melalui route handler streaming internal:
  `GET /api/media/[...key]`
- Endpoint memvalidasi kunci objek, mengambil stream dari MinIO, dan mengalirkan (*pipe stream*) ke klien dengan header `Content-Type` yang sesuai serta cache control yang aman.
