# Dokumentasi Manajemen Bisnis: Phase 03

Dokumen ini menjelaskan arsitektur, skema data, validasi, dan alur kerja pengelolaan profil bisnis, jam operasional, dan parameter reservasi pada proyek **TampilKit Booking**.

---

## 1. Profil Bisnis (`/dashboard/settings/business`)

Modul ini mengelola data identitas dan kontak usaha yang dapat dikonfigurasi melalui dasbor admin.

### Model Data Prisma (`Business`)
- `name`: Nama usaha (contoh: PawCare Grooming).
- `slug`: Identifier URL unik, format kebab-case.
- `description`: Deskripsi profil usaha.
- `email`, `phone`, `whatsapp`: Kontak resmi usaha.
- `address`, `city`, `province`, `postalCode`: Alamat fisik operasional.
- `mapsUrl`: Tautan Google Maps (opsional).
- `timezone`: Zona waktu (default `Asia/Jakarta`).
- `logoObjectKey`: Referensi berkas logo tersimpan di MinIO S3 (`business/logos/{uuid}.webp`).
- `isActive`: Status operasional bisnis.

### Otorisasi & Validasi
- **RBAC**: Hanya peran `OWNER` yang memiliki izin memperbarui profil bisnis (`assertOwner()`). Peran `ADMIN` hanya memiliki hak baca (*read-only*).
- **Validasi Zod**: Format email valid, nomor telepon/WhatsApp numerik internasional, normalisasi slug tanpa spasi, dan perlindungan terhadap slug duplikat.

---

## 2. Jam Operasional Mingguan & Istirahat (`/dashboard/settings/hours`)

Mendukung konfigurasi jadwal kerja 7 hari (Senin hingga Minggu) dengan interval istirahat fleksibel per hari.

### Model Data Prisma (`BusinessOperatingHour` & `BusinessOperatingBreak`)
```prisma
model BusinessOperatingHour {
  id        String                  @id @default(cuid())
  businessId String
  dayOfWeek Int                     // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  isOpen    Boolean                 @default(true)
  openTime  String                  // Format HH:mm (contoh: "09:00")
  closeTime String                  // Format HH:mm (contoh: "17:00")
  breaks    BusinessOperatingBreak[]
}

model BusinessOperatingBreak {
  id              String                @id @default(cuid())
  operatingHourId String
  startTime       String                // Format HH:mm (contoh: "12:00")
  endTime         String                // Format HH:mm (contoh: "13:00")
}
```

### Aturan & Validasi Jadwal
1. **Urutan Waktu**: Waktu buka (`openTime`) harus mendahului waktu tutup (`closeTime`) pada hari yang sama.
2. **Interval Istirahat (*Breaks*)**:
   - `startTime` istirahat harus mendahului `endTime`.
   - Periode istirahat wajib berada sepenuhnya di dalam jam kerja (`openTime <= startTime` dan `endTime <= closeTime`).
   - Tidak boleh ada jadwal istirahat yang saling tumpang tindih (*anti-overlapping breaks*).
3. **Hari Tutup**: Hari yang ditandai `isOpen = false` tidak menghasilkan slot jadwal yang dapat dipesan.

---

## 3. Konfigurasi Parameter Reservasi (`/dashboard/settings/booking`)

Mengontrol parameter sistem yang akan dikonsumsi oleh Mesin Booking (Phase 05).

### Model Data Prisma (`BusinessSetting`)
- `bookingEnabled`: Status aktif sakelar utama reservasi online.
- `currency`: Mata uang transaksi (default `IDR`).
- `bookingIntervalMinutes`: Interval antar slot waktu (default: 30 menit).
- `defaultBufferMinutes`: Waktu jeda pembersihan/persiapan pasca layanan (default: 15 menit).
- `minimumAdvanceMinutes`: Batas minimal reservasi di muka (default: 60 menit).
- `maximumAdvanceDays`: Rentang maksimal hari reservasi ke depan (default: 30 hari).
- `cancellationWindowHours`: Batas waktu pembatalan gratis (default: 24 jam).
- `autoConfirmBooking`: Konfirmasi reservasi otomatis tanpa approval manual admin.
- `allowCustomerReschedule`: Izin pelanggan menjadwalkan ulang mandiri.
