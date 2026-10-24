# Sistem Desain TampilKit Booking (PawCare Grooming)

## 1. Karakter Brand
- **Terpercaya (Trustworthy)**: Kepastian keamanan anabul dan transparansi reservasi tanpa bentrok jadwal.
- **Higienis & Ramah Hewan**: Visual bersih, modern, dan hangat mencerminkan standar sanitasi prima.
- **Cockpit Operasional Presisi**: Densitas data tinggi namun teratur untuk operasional front-desk toko yang cepat dan akurat.

## 2. Rasional Warna & Tipografi
- **Rasio 60-30-10**: 60% Slate netral (`#F8FAFC`/`#FFFFFF`), 30% Navy (`#142C52`), 10% Aksen Teal (`#0D9488`).
- **Semantik Status Booking (7 State)**: Pending (Amber), Confirmed (Blue), Checked-in (Purple), In-progress (Sky), Completed (Emerald), Cancelled (Rose), No-show (Slate), Walk-in badge (Warm Orange). Multi-indikator (warna + teks + dot/icon), kontras WCAG AA ≥4.5:1.
- **Integrasi & Monitoring Kalender**: Status koneksi Google (Connected/Degraded/Syncing/Reauth/Error) & antrean outbox (Pending/Processing/Completed/Failed/Dead-Letter) memakai palet semantik berpasangan dot status. Side-by-side conflict diff membedakan Toko Lokal (Teal `#0D9488`) vs Google Calendar (Blue `#2563EB`) secara instan.
- **Tipografi**: Geist Sans untuk antarmuka/tabel/label; Geist Mono khusus kode booking (`GRM-YYYYMMDD-XXXX`), metrik KPI, durasi, jam operasional, dan tarif IDR.

## 3. Prinsip Komponen & Breakpoint
- **Dashboard KPI & Monitoring Cards**: Kartu metrik ringkas dengan border hover halus, status latensi sinkronisasi, nilai numerik Geist Mono tegas, dan aksen warna sesuai status reservasi/sync.
- **Kalender Day/Week/Month**: Grid terstruktur dengan penanda jam berjalan (merah), slot terisi warna status, dan pola strip diagonal 45° tegas (`.stripe-blocked-time`) untuk membedakan waktu operasional yang diblokir/maintenance.
- **Conflict Resolver & Side-by-Side Diff**: Tampilan komparasi berdampingan atribut lokal vs eksternal dengan tombol aksi cepat (Keep Local / Overwrite Google) dan dialog konfirmasi destruktif.
- **Breakpoint**: Mobile `<640px` (drawer/bottom sheet, calendar day view, sticky actions), Tablet `768px` (2 kolom KPI), Desktop `1024px+` (cockpit penuh: sidebar, multi-view calendar, table filter terpadu).

## 4. Asumsi Desain
- Seluruh token semantik Light & Dark identik di `design-tokens.json` dan tersinkronisasi ke Tailwind CSS v4 di `src/app/globals.css`.
- Interaksi status jadwal dan blokir kalender memberikan feedback visual instan sebelum mutasi asynchronous selesai.
- Indikator status koneksi dan antrean outbox selalu menyertakan label tekstual eksplisit selain warna (kepatuhan WCAG AA non-color-only cue).
