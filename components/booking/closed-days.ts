/**
 * Menentukan hari mingguan yang tutup untuk TAMPILAN pemilihan tanggal.
 *
 * Sumber datanya sama dengan aturan server (tabel jam operasional per hari:
 * `isOpen: false`). Server tetap penentu akhir; Tahap "Pilih Jam" masih
 * menampilkan "Salon Tutup" bila ada perbedaan.
 *
 * Pengaman: `getPublicOperatingHours()` mengisi ketujuh hari sebagai "tutup"
 * bila bisnis/jam tidak terbaca (mis. gangguan database sesaat). Dalam kasus
 * itu (semua hari tutup, atau data kosong) hasilnya dikosongkan agar pelanggan
 * tidak terblokir total oleh data yang tidak bisa dipercaya.
 *
 * @returns nomor hari (0 = Minggu … 6 = Sabtu) yang ditandai libur.
 */
export function getClosedDaysOfWeek(
  schedule: ReadonlyArray<{ dayOfWeek: number; isOpen: boolean }> | null | undefined
): number[] {
  if (!schedule || schedule.length === 0) return [];
  const valid = schedule.filter(
    (d) => Number.isInteger(d.dayOfWeek) && d.dayOfWeek >= 0 && d.dayOfWeek <= 6
  );
  if (valid.length === 0 || !valid.some((d) => d.isOpen)) return [];
  return Array.from(new Set(valid.filter((d) => !d.isOpen).map((d) => d.dayOfWeek))).sort(
    (a, b) => a - b
  );
}
