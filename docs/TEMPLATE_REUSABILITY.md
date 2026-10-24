# Pembuktian Reusabilitas Template (Template Reusability)
# Kasus Uji: Rebranding PawCare Grooming -> Studio Barber

Dokumentasi pembuktian arsitektur bahwa **TampilKit Booking** adalah template serbaguna yang dapat digunakan ulang (*reusable*) untuk model bisnis janji temu lain (seperti *Barbershop / Pangkas Rambut*) **murni melalui konfigurasi data basis data** tanpa mengubah kode sumber inti aplikasi.

---

## 1. Konsep Pemisahan Data & Logika Aplikasi

TampilKit Booking memisahkan secara tegas antara kode mesin aplikasi (*Booking Engine, Availability, Calendar, Auth*) dan data identitas bisnis:
- **Identitas Bisnis**: Disimpan dalam model `BusinessProfile` (nama bisnis, slug, deskripsi, alamat, kontak WhatsApp, tautan peta).
- **Layanan & Tarif**: Disimpan dalam model `ServiceCategory` dan `Service` (durasi pengerjaan, buffer jeda, tarif desimal IDR).
- **Aturan Jadwal**: Disimpan dalam `BusinessOperatingHour`, `BusinessOperatingBreak`, dan `BusinessSetting`.
- **Kapasitas Stasiun**: Disimpan dalam `BookingResource` (misalnya: *Kursi Cukur #1* pada Barber, atau *Meja Grooming #1* pada Pet Care).

---

## 2. Bukti Pengujian Otomatis (`tests/integration/template-rebranding.test.ts`)

Pengujian integrasi otomatis `tests/integration/template-rebranding.test.ts` telah dijalankan dan membuktikan bahwa seluruh alur aplikasi berjalan normal saat bisnis direbrand:

### Profil Bisnis yang Dikonfigurasi Ulang dalam Uji Coba:
- **Nama Bisnis**: `Studio Barber & Grooming Men`
- **Kategori Layanan**: `Haircut & Styling`, `Shave & Beard Care`, `Hair Treatment`
- **Menu Layanan Baru**:
  - *Gentlemen Haircut Premium* (45 Menit, Rp 75.000)
  - *Hot Towel Shave & Facial Massage* (30 Menit, Rp 50.000)
  - *Royal Grooming Combo (Haircut + Shave + Wash)* (75 Menit, Rp 120.000)
- **Jam Operasional**: Selasa s/d Minggu pukul 10:00 - 21:00 (Senin Tutup).

### Hasil Pengujian:
1. **Katalog Publik**: `getPublicServices()` merender kategori dan menu pangkas rambut dengan format harga Rupiah yang benar.
2. **Kalkulasi Slot Ketersediaan**: `getAvailableSlotsForDate()` secara otomatis menghasilkan slot 45 menit dan jeda buffer sesuai konfigurasi barbershop tanpa tabrakan.
3. **Penyimpanan Transaksi**: Pemesanan berhasil dibuat dengan snapshot harga `Rp 75.000` dan menerbitkan kode booking `GRM-YYYYMMDD-XXXX`.
4. **Perubahan Kode Sumber**: **0 baris kode sumber diubah**. Semua berjalan murni melalui database seed / form pengaturan admin.
