# Dokumentasi Mesin Ketersediaan Jadwal (Availability Engine): Phase 05

Dokumen ini menjelaskan algoritma kalkulasi slot waktu, interval okupansi *half-open*, waktu jeda (*buffer time*), penanganan zona waktu, dan pencegahan *double-booking* pada **TampilKit Booking**.

---

## 1. Algoritma Kalkulasi Slot Ketersediaan

Mesin ketersediaan (`src/modules/availability/slot-generator.ts` & `availability.service.ts`) menghasilkan slot waktu reservasi berdasarkan kriteria berlapis:

1. **Jadwal Jam Kerja & Hari Buka**:
   - Membaca data `BusinessOperatingHour` sesuai hari dalam seminggu (`dayOfWeek` 0=Minggu .. 6=Sabtu).
   - Jika hari berstatus `isOpen: false`, sistem mengembalikan array slot kosong.
2. **Kandidat Slot Waktu**:
   - Dihasilkan mulai dari `openTime` hingga `closeTime` berdasarkan konfigurasi interval booking (default 30 menit).
3. **Interval Okupansi Penuh (*Full Occupancy Interval*)**:
   - Rentang waktu dihitung secara matematis menggunakan interval *half-open* `[startAt, occupancyEndAt)`:
     ```text
     serviceEndAt   = startAt + serviceDurationMinutes
     occupancyEndAt = serviceEndAt + (defaultBufferMinutes + serviceAdditionalBuffer)
     ```
4. **Penyaringan (*Filtering*) Validitas Slot**:
   - **Batas Jam Tutup**: `occupancyEndAt` tidak boleh melebihi jam tutup operasional (`closeTime`).
   - **Jeda Istirahat (*Breaks*)**: Interval `[startAt, occupancyEndAt)` tidak boleh tumpang tindih (*overlap*) dengan jadwal istirahat `BusinessOperatingBreak`.
   - **Batas Minimal Waktu Pemesanan (*Advance Notice*)**: Jika reservasi dilakukan pada hari yang sama, slot harus berjarak minimal `minimumAdvanceMinutes` dari waktu saat ini.
   - **Batas Rentang Hari (*Booking Window*)**: Tanggal reservasi tidak boleh melebihi `maximumAdvanceDays` (default 30 hari ke depan).
   - **Reservasi Aktif yang Sudah Ada**: Interval tidak boleh tumpang tindih dengan reservasi berstatus `CONFIRMED` atau `PENDING`.

---

## 2. Definisi Rumus Tumpang Tindih (*Overlap Condition*)

Dua interval waktu A `[startA, endA)` dan B `[startB, endB)` bertabrakan jika dan hanya jika:
```text
startA < endB AND startB < endA
```
Penggunaan interval *half-open* memungkinkan reservasi baru dimulai tepat pada saat reservasi sebelumnya selesai bersama seluruh waktu jeda persiapannya (*back-to-back booking*).

---

## 3. Penanganan Zona Waktu (*Timezone Aware*)

- Seluruh kalkulasi waktu harian diselaraskan dengan zona waktu bisnis yang terdaftar di basis data (default `Asia/Jakarta`, UTC+7).
- Waktu disimpan ke dalam basis data PostgreSQL dalam format UTC murni dan dikonversi secara deterministik saat ditampilkan ke peramban pengguna.

---

## 5. Integrasi Google FreeBusy & Kebijakan Fail-Closed (Phase 07)

Pada Phase 07, mesin ketersediaan diperluas untuk memperhitungkan kesibukan kalender Google pemilik/admin:
1. **Interval Sibuk Eksternal**:
   - Jika integrasi Google Calendar aktif, sistem mengevaluasi kueri FreeBusy dan menyimpan rekaman `CalendarExternalBusyInterval`.
   - Event yang tumpang tindih dengan agenda eksternal Google otomatis ditandai `available = false` dengan alasan `GOOGLE_BUSY`.
2. **Eliminasi Duplikasi Kapasitas**:
   - Event Google yang berkorespondensi dengan reservasi PawCare yang sudah ada di basis data PostgreSQL dieksklusikan dari kalkulasi FreeBusy eksternal agar kapasitas tidak terpotong dua kali.
3. **Kebijakan Fail-Closed**:
   - Jika Google Calendar terhubung namun kueri FreeBusy gagal atau melebihi batas waktu toleransi (`GOOGLE_CALENDAR_FREEBUSY_TIMEOUT_MS`), sistem menolak pembukaan slot booking baru demi keamanan operasional (*fail-closed*):
     > *"Jadwal sedang tidak dapat diperiksa. Silakan coba beberapa saat lagi."*
4. **Fallback Mode Offline**:
   - Jika integrasi Google Calendar tidak diaktifkan atau diputuskan oleh pemilik toko, sistem secara mulus kembali ke mode penghitungan berbasis basis data PostgreSQL murni.
