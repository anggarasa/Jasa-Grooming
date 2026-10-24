# Panduan Operasional & Serah Terima (Operations Handover)
# TampilKit Booking — Basic Booking Template (PawCare Grooming)

**Versi:** 0.8.0  
**Tanggal:** 23 Oktober 2026

---

## 1. Perintah Manajemen Operasional Harian

| Tugas | Perintah CLI | Penjelasan |
| :--- | :--- | :--- |
| **Menjalankan Dev Server** | `npm run dev` | Menjalankan server Next.js lokal pada port default `3000` (atau `-p 1106`) |
| **Menjalankan Production Server** | `npm run build && npm run start` | Mengompilasi dan menjalankan web server produksi |
| **Menjalankan Outbox Worker** | `npm run calendar:worker` | Menjalankan worker persisten yang memproses sinkronisasi Google Calendar |
| **Pengecekan Job Sekali Jalan** | `npm run calendar:worker:once` | Menjalankan satu putaran proses antrean lalu keluar (cocok untuk Cron) |
| **Sinkronisasi Inkremental** | `npm run calendar:sync` | Memicu sinkronisasi manual perubahan remote via `syncToken` |
| **Rekonsiliasi Jadwal** | `npm run calendar:reconcile` | Mencocokkan konsistensi event lokal vs Google Calendar |
| **Pembaruan Webhook Watch** | `npm run calendar:renew-watches` | Memperbarui langganan saluran push notification sebelum expired |
| **Simulasi Backup & Restore** | `npm run backup:drill` | Menguji keabsahan snapshot data dan integritas pemulihan data |
| **Provisioning Akun Owner** | `npm run auth:provision` | Membuat atau mereset kredensial akun OWNER salon |

---

## 2. Lokasi Log & Pemantauan Sistem

- **Log Aplikasi Web**: Konsol stdout/stderr dari proses `next start` (atau file log PM2 `~/.pm2/logs/pawcare-web-out.log`).
- **Log Worker Outbox**: Konsol stdout/stderr dari proses `calendar:worker`.
- **Health Check API**:
  - `GET /api/health` -> Status keseluruhan sistem (`healthy` / `degraded`).
  - `GET /api/health?probe=live` -> Pemeriksaan proses hidup (*Liveness*).
  - `GET /api/health?probe=ready` -> Pemeriksaan kesiapan melayani request (*Readiness*).
- **Dashboard Admin**:
  - Ringkasan Harian: `/dashboard`
  - Antrean & Konflik Google Calendar: `/dashboard/integrations/google-calendar`

---

## 3. Penanganan Insiden Operasional Umum (Incident Response)

### A. Slot Booking Publik Muncul Pesan "Jadwal sedang tidak dapat diperiksa"
- **Penyebab**: Koneksi Google Calendar aktif, tetapi API Google mengalami timeout atau izin OAuth kedaluwarsa (kebijakan *fail-closed* aktif).
- **Solusi**:
  1. Buka `/dashboard/settings/integrations`.
  2. Periksa kartu status Google Calendar. Jika berstatus `REAUTH_REQUIRED` atau `ERROR`, klik tombol **Hubungkan Ulang (Reconnect)**.
  3. Jika Google Calendar sengaja tidak ingin digunakan lagi, klik **Putuskan Koneksi (Disconnect)**; sistem akan seketika kembali ke mode ketersediaan PostgreSQL murni.

### B. Terjadi Konflik Jadwal (Conflict Badge di Dashboard)
- **Penyebab**: Admin mengubah jam janji temu langsung di aplikasi Google Calendar (bukan lewat dasbor PawCare) atau menghapus event managed di Google.
- **Solusi**:
  1. Buka `/dashboard/integrations/google-calendar`.
  2. Buka panel konflik yang aktif.
  3. Klik **Pulihkan Event ke Google** untuk mengembalikan waktu event remote sesuai basis data resmi PawCare, atau klik **Tandai Selesai**.

### C. Antrean Outbox Menumpuk (*Outbox Lag High*)
- **Penyebab**: Proses background worker `calendar:worker` berhenti berjalan.
- **Solusi**: Periksa status proses worker melalui PM2 atau jalankan ulang `npm run calendar:worker`.
