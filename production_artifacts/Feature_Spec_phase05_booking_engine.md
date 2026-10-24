# Spesifikasi Fitur: Phase 05 — Booking Engine, Availability & Customer Reservation

## 1. Ringkasan Eksekutif & Tujuan Bisnis
- Mengembangkan mesin reservasi mandiri (Booking Engine) terintegrasi yang menghitung ketersediaan slot waktu secara real-time, mencegah double-booking dengan proteksi konkurensi level PostgreSQL, serta menyediakan public booking wizard 6 langkah.
- Tujuan: Menghilangkan bentrok jadwal layanan grooming, mengamankan data transaksi dengan snapshot harga/durasi, dan memberikan pengalaman reservasi anabul yang cepat, transparan, dan dapat dikelola mandiri oleh pelanggan.

## 2. User Stories & Kebutuhan
- **User Story**: Pelanggan publik dapat memilih layanan, mengecek tanggal & jam yang tersedia, mengisi data diri & anabul, lalu menyelesaikan booking untuk mendapatkan kode unik `GRM-YYYYMMDD-XXXX` dan link kelola reservasi berbasis token aman.
- **Kebutuhan Fungsional**:
  - Availability Engine (`src/modules/availability/`): kalkulasi slot berbasis jam operasional, istirahat, durasi layanan, buffer time, min advance (60m), max advance (30h), zona waktu Asia/Jakarta, interval half-open `[startAt, occupancyEndAt)`.
  - Concurrency Safety: shared resource `BookingResource` ("Main Grooming Station"), proteksi PostgreSQL exclusion constraint / transaction isolation / advisory lock (1 sukses, konkurensi bersamaan return 409 `SLOT_UNAVAILABLE`).
  - Skema Relasional & Snapshot: model `BookingResource`, `BookingStatusHistory`, `BookingAccessToken`, `BookingIdempotency`; snapshot nama layanan, durasi, harga, dan notes pada `Booking`.
  - Idempotency & Code: proteksi double-submit via header `Idempotency-Key` dan hashing fingerprint; generator kode unik `GRM-YYYYMMDD-XXXX`.
  - Public Wizard & Portal Tamu: UI 6 langkah di `/booking` (Layanan, Tanggal, Jam, Pelanggan, Anabul, Konfirmasi), layar `/booking/confirmation`, dan portal tamu aman `/booking/manage?token=...` (token SHA-256 ter-hash di DB).
- **Kebutuhan Non-Fungsional**: Zero double-booking, sanitasi input Zod, atomisitas Prisma transaction, penanganan timezone strictly ISO-8601 Asia/Jakarta, dan UI mobile-friendly.

## 3. Tech Stack & Kebutuhan Layer
- Next.js 16 App Router, TypeScript (strict), PostgreSQL, Prisma ORM, Tailwind CSS v4, shadcn/ui, Zod, crypto (token hashing).
- `Butuh: Backend=ya, Frontend Web=ya, Mobile=tidak, Perubahan UI=ya`

## 4. Lokasi Kode & Struktur Folder
- `prisma/`: schema updates (tambah `BookingResource`, `BookingStatusHistory`, `BookingAccessToken`, `BookingIdempotency`, field snapshot `Booking`), migrations, update `seed.ts`.
- `src/modules/availability/`: `availability.service.ts`, `slot-generator.ts`, `types.ts`, `schemas.ts`.
- `src/modules/bookings/`: `booking.service.ts`, `concurrency-lock.ts`, `code-generator.ts`, `token.service.ts`, `idempotency.service.ts`.
- `src/app/api/`: `availability/route.ts`, `bookings/route.ts`, `bookings/manage/route.ts`.
- `src/app/(public)/booking/`: `page.tsx` (wizard container & 6-step form components), `confirmation/page.tsx`, `manage/page.tsx`.
- `tests/`: `tests/unit/availability/` (slot, buffer, tz), `tests/integration/booking/` (booking creation, idempotency, concurrent double-booking).

## 5. Kontrak Data / API Garis Besar
- `GET /api/availability?serviceId=<id>&date=YYYY-MM-DD` -> `{ success: true, date: string, slots: [{ time: "09:00", available: boolean }] }`
- `POST /api/bookings` (Header: `Idempotency-Key`) -> Body: `{ serviceId, date, time, customer: { name, phone, email }, pet: { name, type, breed, age, notes }, notes }` -> `{ success: true, bookingCode, manageToken, booking: { id, startAt, status, totalPrice } }`
- `GET /api/bookings/manage?token=<token>` -> `{ success: true, booking: { bookingCode, status, service, customer, pet, startAt, canCancel } }`
- Alur Data: Client Wizard -> API Endpoint (Zod & Idempotency Check) -> Availability & Concurrency Guard -> Prisma Transaction (Atomic Customer, Pet, Booking, Snapshot, History, Token) -> Response & Redirect Confirmation.

## 6. Brief Desain untuk Designer
- **Mood**: Profesional, higienis, terstruktur, ramah pemilik anabul (pet-friendly), dan bebas friksi.
- **Wizard UX**: Stepper indikator interaktif (1-6), kartu layanan visual, calendar picker dengan disable hari libur/penuh, slot jam chips (tersedia/terisi), form input data anabul yang ringkas, kartu review biaya transparan.
- **Confirmation & Manage**: Badge status elegan, tombol "Simpan Link Reservasi / Salin Kode", tombol "Kelola Jadwal", dan kartu tiket reservasi siap simpan.

## 7. Risiko, Asumsi & Pertanyaan Terbuka
- **Risiko**: Balapan konkurensi (race condition) pada milidetik yang sama saat 2 user memilih slot terakhir.
  - Mitigasi: Transaksi database terisolasi dengan exclusive lock / exclusion constraint pada resource interval slot.
- **Asumsi**:
  1. Default single station: Semua layanan menggunakan shared resource `BookingResource` ("Main Grooming Station") berkapasitas 1 pengerjaan per interval waktu.
  2. Status awal booking ditentukan oleh `BusinessSetting.autoConfirmBooking` (default: false -> `PENDING`, true -> `CONFIRMED`).
  3. Pembayaran berstatus Pay-at-Location (bayar langsung di tempat saat sesi grooming).
- **Pertanyaan Terbuka**:
  1. Apakah di halaman `/booking/manage` pelanggan diizinkan langsung melakukan pembatalan mandiri (`CANCELLED`) jika masih di luar cancellation window, atau hanya melihat status reservasi?
