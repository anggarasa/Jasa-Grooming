# Panduan Penerapan Produksi (Deployment Runbook)
# TampilKit Booking — Basic Booking Template (PawCare Grooming)

**Versi:** 0.8.0  
**Tanggal:** 23 Oktober 2026

---

## 1. Persyaratan Lingkungan Produksi (Prerequisites)

- **Node.js**: Versi 24 LTS (atau 20 LTS ke atas).
- **Package Manager**: `npm` versi 10+ (eksklusif, jangan gunakan yarn/pnpm).
- **PostgreSQL**: Versi 15+ dengan ekstensi dasar.
- **MinIO S3 / S3-Compatible Storage**: Bucket aktif `tampilkit-booking`.
- **Domain & SSL**: Domain publik dengan sertifikat HTTPS aktif (diperlukan untuk webhook Google Calendar).
- **Reverse Proxy**: Nginx, Caddy, atau Cloudflare untuk SSL termination dan static asset caching.

---

## 2. Daftar Periksa Pra-Deployment (Pre-Deployment Checklist)

1. [ ] Seluruh variabel lingkungan telah dikonfigurasi di server:
   - `DATABASE_URL` (dengan parameter pooling yang sesuai).
   - `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET` (kunci acak 64 karakter).
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
   - `GOOGLE_TOKEN_ENCRYPTION_KEY` & `GOOGLE_OAUTH_STATE_SECRET`.
   - `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`.
2. [ ] Basis data produksi telah dicadangkan (*backup logical dump*) sebelum migrasi.
3. [ ] URL callback Google OAuth di Google Cloud Console telah mendaftarkan domain produksi (`https://DOMAIN_ANDA/api/integrations/google/callback`).

---

## 3. Urutan Eksekusi Penerapan (Deployment Sequence)

Jalankan tahapan berikut secara berurutan:

```bash
# 1. Unduh kode sumber versi rilis
git checkout tags/v0.8.0

# 2. Instal dependensi bersih dan terkunci
npm ci --omit=dev

# 3. Generate Prisma Client
npx prisma generate

# 4. Terapkan migrasi basis data (tanpa reset)
npx prisma migrate deploy

# 5. Kompilasi aset Next.js produksi
npm run build

# 6. Jalankan proses aplikasi Next.js (menggunakan PM2 / Systemd)
pm2 start npm --name "pawcare-web" -- run start

# 7. Jalankan proses Calendar Worker di background (menggunakan PM2 / Systemd)
pm2 start npm --name "pawcare-worker" -- run calendar:worker

# 8. Verifikasi status kesiapan aplikasi
curl -f http://localhost:3000/api/health?probe=ready || exit 1
```

---

## 4. Verifikasi Pasca-Deployment (Post-Deployment Smoke Tests)

1. **Uji Health Endpoint**: Buka `https://DOMAIN_ANDA/api/health` dan pastikan status `database` dan `storage` mengembalikan `healthy`.
2. **Uji Halaman Publik**: Akses Beranda, Katalog Layanan, dan Galeri Foto.
3. **Uji Login Administrator**: Masuk ke `/login` menggunakan akun OWNER yang telah di-provisioning.
4. **Uji Simulasi Reservasi**: Lakukan 1 pemesanan uji coba pada tanggal mendatang dan verifikasi kode booking `GRM-YYYYMMDD-XXXX`.
5. **Uji Worker Outbox**: Periksa tabel job antrean di `/dashboard/integrations/google-calendar`.
