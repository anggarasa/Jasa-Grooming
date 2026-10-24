# Spesifikasi Fitur: Phase 03 — Business Settings, Service Management & MinIO Media

## 1. Ringkasan Eksekutif & Tujuan Bisnis
Mengimplementasikan manajemen operasional bisnis inti: Profil Bisnis, Jam Operasional & Istirahat, Pengaturan Booking, Manajemen Kategori & Layanan Grooming (Decimal IDR), Galeri Bisnis, dan Media Storage MinIO server-side. Tujuannya memberi kendali penuh bagi OWNER/ADMIN untuk mengonfigurasi toko, jadwal kerja, katalog servis, dan aset media secara aman sebelum modul booking publik diaktifkan.

## 2. User Stories & Kebutuhan
- **User Stories**:
  - Sebagai OWNER, saya dapat mengubah profil bisnis, jam operasional/istirahat mingguan, dan konfigurasi booking agar jadwal toko akurat.
  - Sebagai ADMIN/OWNER, saya dapat mengelola kategori, layanan grooming (harga IDR, durasi, buffer, foto), dan galeri foto dengan upload aman.
- **Kebutuhan Fungsional**:
  - Form profil bisnis (alamat, kontak, WA, maps URL, logo) & konfigurasi booking (advance booking, cancellation window, buffer).
  - Jadwal jam kerja 7 hari + istirahat multi-slot dengan validasi urutan waktu & pencegahan overlap.
  - CRUD Kategori & Layanan (IDOR safe via businessId, Decimal 12,2 IDR, safe delete/deactivation jika ada booking).
  - Galeri bisnis (upload MinIO, caption, altText, displayOrder, status aktif).
  - Media upload MinIO terisolasi server-side: max 5MB, format JPEG/PNG/WebP, validasi magic bytes (tolak SVG/executable).
  - RBAC: OWNER (akses penuh + settings bisnis/booking), ADMIN (katalog servis, galeri, read settings).
- **Kebutuhan Non-Fungsional**:
  - Zod validation di API & React Hook Form client, UI feedback Sonner toast, audit log tindakan sensitif.

## 3. Tech Stack & Kebutuhan Layer
- **Stack**: Next.js 16 (App Router), React 19, TypeScript strict, Prisma ORM 6, PostgreSQL, MinIO S3 SDK, Tailwind CSS v4, Lucide React, Zod.
- `Butuh: Backend=ya, Frontend Web=ya, Mobile=tidak, Perubahan UI=ya`

## 4. Lokasi Kode & Struktur Folder
- `prisma/`: schema updates (`BusinessOperatingHour`, `BusinessOperatingBreak`, `BusinessGallery`, fields baru di `Business`, `BusinessSetting`, `Service`).
- `src/app/api/`: `business/` (`route.ts`, `hours/`, `booking-settings/`), `service-categories/`, `services/`, `gallery/`, `media/` (`upload/`, `[id]/`).
- `src/app/dashboard/`: `settings/business/`, `settings/hours/`, `settings/booking/`, `services/` (`page.tsx`, `new/`, `[id]/edit/`, `categories/`), `gallery/`.
- `src/modules/`: `business/` (service, schema), `services/` (service, schema), `gallery/`, `media/` (upload, magic bytes validator).
- `src/components/dashboard/`: Komponen form (Profile, Hours, BookingSettings, ServiceForm, CategoryDialog, GalleryGrid).

## 5. Kontrak Data & API Utama
- **Model Baru/Diperluas**:
  - `Business`: tambah `whatsapp`, `fullAddress`, `city`, `province`, `postalCode`, `googleMapsUrl`, `status`.
  - `BusinessOperatingHour` (`businessId`, `dayOfWeek` 0-6, `isOpen`, `openTime`, `closeTime`), `BusinessOperatingBreak` (`operatingHourId`, `startTime`, `endTime`).
  - `BusinessSetting`: tambah `minimumAdvanceMinutes`, `maximumAdvanceDays`, `cancellationWindowHours`, `autoConfirmBooking`, `allowCustomerReschedule`.
  - `ServiceCategory`: tambah `displayOrder`.
  - `Service`: tambah `shortDescription`, `fullDescription`, `bufferMinutes`, `displayOrder`.
  - `BusinessGallery`: `id`, `businessId`, `objectKey`, `caption`, `altText`, `displayOrder`, `isActive`.
- **API Endpoints**:
  - `GET/PATCH /api/business`, `GET/PUT /api/business/hours`, `GET/PATCH /api/business/booking-settings`
  - `GET/POST /api/service-categories`, `GET/PATCH/DELETE /api/service-categories/[id]`
  - `GET/POST /api/services`, `GET/PATCH/DELETE /api/services/[id]`
  - `GET/POST /api/gallery`, `PATCH/DELETE /api/gallery/[id]`
  - `POST /api/media/upload`, `GET/DELETE /api/media/[id]` (proxy streaming / presigned URL)

## 6. Brief Desain UI Dashboard
- **Karakter**: Dashboard profesional, bersih, padat informasi (dense data table, modal CRUD, drag/order list, visual image preview card).
- **Elemen UI**: Tab navigasi settings, time-picker / slot builder jam operasional, rupiah currency input mask, uploader dropzone dengan preview thumbnail & badge status aktif.

## 7. Risiko, Asumsi & Pertanyaan Terbuka
- **Risiko**: Inkonsistensi validasi jam buka dan istirahat lintas zona waktu; celah keamanan file jika hanya cek MIME/ekstensi (mitigasi: header magic bytes inspection).
- **Asumsi**:
  1. Single-tenant model: 1 record Business utama per instance sistem.
  2. Gambar MinIO disajikan via proxy Next.js `/api/media/[id]` untuk menghindari issue CORS/private bucket pada Docker lokal.
- **Pertanyaan Terbuka**:
  1. Apakah gambar servis dan galeri memerlukan kompresi/auto-resize (Sharp) di server sebelum disimpan ke MinIO, atau simpan raw buffer setelah validasi ukuran/magic bytes?
