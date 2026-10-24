# Memori: frontend

> Pelajaran nyata dari proyek ini, ditulis oleh `curator`. Format: `- [YYYY-MM-DD] [Kategori] Pelajaran & cara mencegahnya.` (maks ±25 kata/entry, ±20 entry).

- [2026-10-23] [Rendering] Hindari tanggal lokal saat SSR, gunakan kalkulasi deterministik zona waktu, dan sertakan cleanup flag pada async effect React 19.
- [2026-10-23] [Data Binding] Gunakan optional chaining pada payload bersarang dan ambil kontak dari konfigurasi terpusat.
- [2026-10-23] [Routing] Sertakan export const instant = false pada Server Components pembaca data dinamis saat cacheComponents aktif di Next.js 16.
- [2026-10-23] [Komponen] Hindari elemen block di dalam DialogDescription Radix untuk mencegah hydration error dan jangan gunakan watch() di useEffect.
- [2026-10-23] [State UI] Mutasi status baris tabel berdasarkan respons safe-deactivation server alih-alih langsung menghapusnya dari state lokal.
- [2026-10-23] [Komponen] Gunakan utility transform resmi Tailwind, batas tinggi maksimal berscroll vertikal, serta dropzone media adaptif agar modal tidak meluap viewport.
- [2026-10-23] [Aksesibilitas] Sertakan DialogTitle dan DialogDescription pada dialog serta terapkan focus trap dan aria-label form sesuai standar aksesibilitas.
- [2026-10-23] [State UI] Hindari setState sinkron di useEffect dialog; gunakan event handler penutup atau render-state adjustment saat sinkronisasi props.
- [2026-10-23] [Rendering] Sertakan suppressHydrationWarning pada elemen html dan body root layout untuk mencegah hydration mismatch akibat injeksi atribut ekstensi browser.
- [2026-10-23] [Penyajian Data] Prioritaskan data snapshot historis daripada relasi master saat menampilkan rincian agar riwayat transaksi masa lalu tidak berubah.
- [2026-10-23] [Serialisasi] Konversi objek custom seperti Prisma Decimal dan Date ke tipe primitif sebelum dioper dari Server Component ke Client Component.
