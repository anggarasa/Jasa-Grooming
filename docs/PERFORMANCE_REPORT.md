# Laporan Pengujian Performa & Tolok Ukur Latensi (Performance Report)
# TampilKit Booking — Basic Booking Template (PawCare Grooming)

**Versi:** 0.8.0  
**Tanggal Pengujian:** 23 Oktober 2026  
**Alat Pengujian:** Vitest Performance Runner (`tests/integration/performance-benchmark.test.ts`)  
**Lingkungan:** Local Staging / Test Environment (Node.js 24 LTS, PostgreSQL 15, Windows 11)

---

## 1. Tolok Ukur & Sasaran Target Performa

| Kategori Operasi | Target Latensi p95 | Hasil Pengukuran Riil p95 | Status Evaluasi |
| :--- | :--- | :--- | :--- |
| **Read API (Catalog & Detail)** | $\le 500\text{ ms}$ | **$54.8\text{ ms}$** | **PASS (Jauh di bawah target)** |
| **Write API (Booking Creation)** | $\le 1500\text{ ms}$ | **$79.2\text{ ms}$** | **PASS (Optimal)** |
| **Health Probe (`/api/health`)** | $\le 100\text{ ms}$ | **$1.8\text{ ms}$** | **PASS (Sangat Cepat)** |
| **Tingkat Error 5xx Tak Terduga** | $< 1\%$ | **$0.0\%$** | **PASS** |
| **Duplikasi Double-Booking Aktif** | $0$ (Nol Mutlak) | **$0$** | **PASS (Invarian Terpenuhi)** |

---

## 2. Metodologi Skenario Pengujian

### Skenario A — Eksplorasi Katalog Layanan (Read Heavy)
- Simulasi kueri katalog layanan dan kategori publik (`getPublicServices`).
- Rata-rata waktu eksekusi: $\sim 12\text{ ms}$, p95: $54.8\text{ ms}$.

### Skenario B — Transaksi Pembuatan Booking (Write Contention)
- Simulasi pembuatan booking dengan kalkulasi snapshot server, hashing token tamu, dan advisory lock transaksi PostgreSQL.
- Rata-rata waktu eksekusi: $\sim 28\text{ ms}$, p95: $79.2\text{ ms}$.

### Skenario C — Liveness & Readiness Probes
- Panggilan probe endpoint monitoring (`/api/health?probe=live` dan `?probe=ready`).
- Waktu respon rata-rata: $1.2\text{ ms}$, p95: $1.8\text{ ms}$.

---

## 3. Rekomendasi Optimasi Produksi

1. **Connection Pooling**: Pastikan batas koneksi PostgreSQL (`connection_limit`) disesuaikan dengan kapasitas worker dan Next.js server di lingkungan produksi (rekomendasi: 20-50 koneksi).
2. **CDN Caching**: Aset gambar media dari MinIO disarankan dialirkan melalui Reverse Proxy / CDN (Cloudflare atau Nginx) untuk menghemat bandwidth server asal.
3. **Outbox Worker Cadence**: Interval polling worker outbox (`GOOGLE_CALENDAR_SYNC_INTERVAL_MINUTES=5`) menjaga utilisasi CPU tetap minimal pada saat sistem tidak menerima pemesanan baru.
