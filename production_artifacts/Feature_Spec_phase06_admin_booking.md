# Spesifikasi Fitur: Phase 06 — Admin Booking Dashboard & Appointment Management

## 1. Ringkasan Eksekutif & Tujuan Bisnis
- Mengembangkan modul manajemen reservasi dan operasional terpadu bagi Admin & Owner PawCare Grooming (dashboard metrik real-time, tabel booking, kalender Day/Week/Month, walk-in booking, direktori pelanggan & anabul, serta pemblokiran waktu manual).
- Tujuan: Memberikan kendali penuh pada alur kedatangan anabul, mencegah bentrok jadwal dengan audit trail transparan, serta mempercepat operasional front-desk toko secara akurat dan atomik.

## 2. User Stories & Kebutuhan
- **User Story**: Sebagai Admin/Owner, saya dapat memantau jadwal harian, mengelola siklus status (Check-in s/d Selesai), reschedule/batal jadwal, membuat booking walk-in, memblokir waktu operasional, dan melihat histori pelanggan & anabul.
- **Kebutuhan Fungsional**:
  - Dashboard Overview (`/dashboard`): Metrik KPI real-time (Hari ini, Mendatang, Dikonfirmasi, Sedang Dikerjakan, Selesai, Dibatalkan), tabel jadwal hari ini, aksi cepat.
  - Booking Table (`/dashboard/bookings`): Server-side pagination, search multi-field (kode/nama/telepon), filter status/tanggal/layanan, sorting, quick actions.
  - Detail Booking (`/dashboard/bookings/[id]`): Snapshot layanan historis, info pelanggan & anabul, catatan internal, log status & reschedule, alasan batal.
  - Kalender Interaktif (`/dashboard/calendar`): Tampilan Day/Week/Month, visualisasi jam operasional, blok booking, blocked times, klik detail/walk-in.
  - State Machine: `PENDING` -> `CONFIRMED` -> `CHECKED_IN` -> `IN_PROGRESS` -> `COMPLETED`. Terminal: `COMPLETED`, `CANCELLED`, `NO_SHOW`.
  - Reschedule & Batal: Modal validasi kapasitas/buffer/breaks, pelepasan slot instan, pencatatan alasan batal & `cancelledAt`, histori reschedule.
  - Walk-in Booking (`/dashboard/bookings/new`): Engine Phase 05, server-side pricing, penanda `source = WALK_IN | ADMIN`, opsi auto-confirm.
  - Direktori Customer & Pets (`/dashboard/customers`, `[id]`): Pencarian kontak, profil anabul, metrik kunjungan, riwayat booking terhubung.
  - ResourceBlock (`/dashboard/blocked-times`): Pemblokiran waktu manual (maintenance/istirahat darurat) terintegrasi ke engine ketersediaan slot.
  - Concurrency, Audit & RBAC: Postgres advisory lock pada mutasi jadwal; log mutasi di `BookingAuditLog`; proteksi RBAC `OWNER`/`ADMIN`.
- **Kebutuhan Non-Fungsional**: Respon query tabel < 250ms, atomisitas transaksi Prisma ACID, validasi Zod, konsistensi zona waktu Asia/Jakarta.

## 3. Tech Stack & Kebutuhan Layer
- Next.js 16 (App Router), React 19, TypeScript (strict), PostgreSQL, Prisma ORM, Tailwind CSS v4, shadcn/ui, Lucide Icons, Zod.
- `Butuh: Backend=ya, Frontend Web=ya, Mobile=tidak, Perubahan UI=ya`

## 4. Lokasi Kode & Struktur Folder
- `prisma/`: schema updates (`BookingStatus` tambah `CHECKED_IN`, `IN_PROGRESS`; model `ResourceBlock`, `BookingRescheduleHistory`, `BookingAuditLog`; field `source`), migrasi & seed.
- `src/modules/bookings/`: `admin-booking.service.ts`, `state-machine.ts`, `reschedule.service.ts`, `audit.service.ts`, `resource-block.service.ts`, `admin-schemas.ts`.
- `src/modules/customers/`: `customer.service.ts`, `customer.types.ts`.
- `src/app/api/admin/`: `bookings/route.ts`, `bookings/[id]/route.ts`, `bookings/[id]/status/route.ts`, `bookings/[id]/reschedule/route.ts`, `calendar/route.ts`, `blocked-times/route.ts`, `customers/route.ts`.
- `src/app/dashboard/`: `page.tsx` (metrik riil), `bookings/` (`page.tsx`, `new/page.tsx`, `[id]/page.tsx`), `calendar/page.tsx`, `customers/` (`page.tsx`, `[id]/page.tsx`), `blocked-times/page.tsx`.
- `src/components/dashboard/`: aktifkan sidebar (bookings, calendar, customers, blocked-times), status badges, filters, calendar grid, reschedule & cancel modal.
- `tests/`: `tests/unit/admin-booking/` (state machine, audit log, time blocking), `tests/integration/admin-booking/` (reschedule lock, walk-in, RBAC).

## 5. Kontrak Data / API Garis Besar
- `GET /api/admin/bookings?page=1&limit=10&status=...&search=...&date=...` -> `{ data: BookingItem[], meta: { total, page, totalPages } }`
- `PATCH /api/admin/bookings/[id]/status` -> Body: `{ status: BookingStatus, reason?: string, internalNotes?: string }` -> `{ success: true, booking }`
- `POST /api/admin/bookings/[id]/reschedule` -> Body: `{ date: "YYYY-MM-DD", time: "HH:mm", reason: string }` -> `{ success: true, booking }`
- `POST /api/admin/bookings/walk-in` -> Body: `{ serviceId, date, time, customer, pet, autoConfirm?: boolean }` -> `{ success: true, booking }`
- `GET /api/admin/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD` -> `{ bookings: CalendarBooking[], blockedTimes: ResourceBlock[] }`
- `POST/DELETE /api/admin/blocked-times` -> Body: `{ resourceId, startAt, endAt, reason }` -> `{ success: true, blockedTime }`
- `GET /api/admin/customers?search=...` & `GET /api/admin/customers/[id]` -> Profil pelanggan, relasi anabul, riwayat booking.
- Alur Data: Admin UI -> Protected Route (RBAC) -> Service & Advisory Lock -> Prisma Atomic Transaction -> Audit Log -> Revalidate/UI Update.

## 6. Brief Desain untuk Designer
- **Mood**: Cockpit operasional profesional, responsif, berdensitas informasi tinggi namun tetap nyaman dan teratur.
- **UI Elements**: Status chips tegas (Pending: amber, Confirmed: blue, Checked-in: purple, In-progress: sky, Completed: emerald, Cancelled: rose, No-show: slate). Kalender Day/Week/Month interaktif dengan pembeda visual strip diagonal untuk blocked times dan badge walk-in. Modal aksi konfirmasi aman.

## 7. Risiko, Asumsi & Pertanyaan Terbuka
- **Risiko**: Race condition saat admin reschedule / walk-in bersamaan dengan user booking slot yang sama. Mitigasi: Gunakan Postgres advisory lock seragam.
- **Asumsi**:
  1. Seluruh operasional menggunakan `BookingResource` utama ("Main Grooming Station") berkapasitas tunggal per slot interval.
  2. Pelanggan walk-in minimal mengisi nama dan nomor telepon aktif (email opsional).
  3. Reschedule atau pembatalan seketika memperbarui kapasitas ketersediaan slot kalender tanpa menghilangkan data historis.
- **Pertanyaan Terbuka**:
  1. Apakah saat pembatalan atau reschedule oleh admin, sistem perlu menyediakan tombol pintas pembuatan pesan konfirmasi WhatsApp untuk dikirim langsung ke pelanggan?
