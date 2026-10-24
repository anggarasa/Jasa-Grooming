# Prosedur Pemulihan & Rollback (Rollback Runbook)
# TampilKit Booking — Basic Booking Template (PawCare Grooming)

**Versi:** 0.8.0  
**Tanggal:** 23 Oktober 2026

---

## 1. Pemicu Rollback (Rollback Triggers)

Rollback darurat wajib dilakukan jika setelah deployment terjadi salah satu kondisi berikut:
1. Peningkatan error HTTP 5xx melebihi 1% selama 5 menit berturut-turut.
2. Kerusakan integritas data atau kegagalan transaksi booking (`SLOT_UNAVAILABLE` palsu massal).
3. Kegagalan autentikasi login admin yang tidak dapat dipulihkan segera.
4. Worker outbox mengalami crash berulang (*loop crash*) yang memicu penumpukan antrean tak terkendali.

---

## 2. Prinsip Penting Rollback Basis Data

> **PERINGATAN**: Rollback kode aplikasi dan rollback basis data **tidak identik**. Migrasi Prisma yang telah diterapkan ke PostgreSQL tidak boleh dibatalkan secara ceroboh (*prisma db push/reset*), karena berisiko menghapus data reservasi pelanggan baru.

### Kebijakan Penanganan Migrasi:
- **Strategi Forward-Repair**: Seluruh skema migrasi TampilKit dirancang bersifat *backward-compatible*. Jika kode di-rollback ke versi sebelumnya, skema kolom baru yang bernilai nullable tidak akan merusak versi aplikasi lama.
- **Jangan Restore Database Kecuali Korup**: Hanya pulihkan dump database jika terjadi korupsi data fisik. Jika hanya ada bug pada kode aplikasi, cukup rollback kode aplikasi Next.js saja.

---

## 3. Tahapan Eksekusi Rollback Kode Aplikasi

```bash
# 1. Hentikan worker antrean outbox sementara agar tidak memproses job dengan logika bermasalah
pm2 stop pawcare-worker

# 2. Kembalikan repositori ke rilis stabil sebelumnya
git checkout tags/v0.7.0  # atau commit hash stabil terakhir

# 3. Instal dependensi versi stabil
npm ci --omit=dev

# 4. Generate ulang Prisma Client sesuai versi stabil
npx prisma generate

# 5. Build ulang aplikasi Next.js
npm run build

# 6. Restart proses web server
pm2 restart pawcare-web

# 7. Aktifkan kembali worker antrean
pm2 start pawcare-worker

# 8. Verifikasi kesehatan sistem
curl -f http://localhost:3000/api/health
```

---

## 4. Penanganan Sinkronisasi Google Calendar Pasca-Rollback

Jika terjadi rollback, periksa status antrean outbox:
1. Buka dashboard di `/dashboard/integrations/google-calendar`.
2. Jika ada job yang berstatus `FAILED` akibat kegagalan sebelum rollback, periksa payload mutasi.
3. Klik tombol **Coba Lagi (Retry)** pada antrean outbox untuk melanjutkan sinkronisasi event ke Google Calendar secara aman.
