# Manual Resource Time Blocking

Dokumentasi fitur pemblokiran waktu stasiun kerja manual (*Resource Time Blocking*) pada aplikasi **TampilKit Booking (PawCare Grooming)**.

---

## 1. Tujuan & Konteks Bisnis

Di salon grooming hewan, ada situasi operasional tertentu di mana stasiun grooming tidak dapat melayani reservasi pelanggan meskipun berada dalam jam operasional toko. Contoh kasus:
- Pembersihan berkala dan sterilisasi meja grooming / bak mandi anabul.
- Perawatan atau servis peralatan blower dan gunting listrik.
- Briefing staf atau pelatihan grooming internal.
- Istirahat darurat atau kendala teknis (listrik padam, suplai air terhambat).

Fitur **Blokir Waktu (`ResourceBlock`)** memungkinkan pemilik dan staf admin untuk secara fleksibel memblokir interval waktu tertentu agar tidak muncul di pilihan slot publik.

---

## 2. Model Basis Data `ResourceBlock`

Didefinisikan dalam `prisma/schema.prisma`:

```prisma
model ResourceBlock {
  id              String          @id @default(cuid())
  businessId      String
  resourceId      String
  startAt         DateTime
  endAt           DateTime
  reason          String
  createdByUserId String
  cancelledAt     DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  business        BusinessProfile @relation(fields: [businessId], references: [id], onDelete: Cascade)
  resource        BookingResource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  createdByUser   User            @relation(fields: [createdByUserId], references: [id], onDelete: Cascade)

  @@index([businessId, startAt])
  @@index([resourceId, startAt, endAt])
}
```

---

## 3. Integrasi dengan Availability Engine

Ketika pelanggan publik membuka halaman `/booking` atau admin membuka modal Walk-in:
1. `slot-generator.ts` mengambil seluruh `ResourceBlock` aktif (`cancelledAt IS NULL`) untuk tanggal yang diminta.
2. Setiap interval blokir `[block.startAt, block.endAt)` dievaluasi terhadap setiap kandidat slot waktu `[slotStart, slotOccupancyEnd)`.
3. Jika terjadi irisan interval:
   $$\max(\text{slotStart}, \text{blockStart}) < \min(\text{slotOccupancyEnd}, \text{blockEnd})$$
   maka slot tersebut otomatis ditandai `available = false` dengan alasan `BLOCKED_BY_ADMIN`.

---

## 4. Validasi Pembuatan Blokir Waktu

Saat admin membuat blokir waktu baru di `/dashboard/blocked-times`:
1. **Validasi Waktu**: `endAt` wajib lebih besar dari `startAt`.
2. **Cek Tumpang Tindih Pemblokiran**: Sistem memeriksa apakah ada blokir waktu aktif lain yang bertabrakan.
3. **Cek Tabrakan Pemesanan**: Sistem memastikan tidak ada pemesanan berstatus aktif (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`) pada interval tersebut. Jika ada, permintaan ditolak dengan pesan peringatan konflik reservasi pelanggan.
4. **Pembatalan Blokir (Release)**: Admin dapat membatalkan blokir waktu (`DELETE /api/admin/resource-blocks/[id]`). Sistem mengisi `cancelledAt = now()` sehingga slot waktu tersebut otomatis terbuka kembali untuk reservasi pelanggan.
