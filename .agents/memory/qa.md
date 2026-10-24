# Memori: qa

> Pelajaran nyata dari proyek ini, ditulis oleh `curator`. Format: `- [YYYY-MM-DD] [Kategori] Pelajaran & cara mencegahnya.` (maks ±25 kata/entry, ±20 entry).

- [2026-10-23] [Audit] Uji edge case payload kosong, sanitasi pemisah unicode serialisasi data, dan kompatibilitas opsi framework Next.js.
- [2026-10-23] [Keamanan] Uji konkurensi token refresh secara simultan dan pastikan cookie terhapus saat pencabutan sesi aktif pengguna.
- [2026-10-23] [Keamanan] Uji IDOR isolasi tenant pada penghapusan berkas serta injeksi traversal bertingkat dan karakter null byte.
- [2026-10-23] [Audit] Uji rekonsiliasi state UI pada penonaktifan aman serta batas atas numerik dan keunikan elemen array.
- [2026-10-23] [UI/UX] Uji responsivitas modal dialog pada viewport terbatas guna memastikan seluruh konten dan tombol aksi dapat di-scroll.
- [2026-10-23] [Aksesibilitas] Uji initial focus dan siklus keyboard focus trap pada modal dialog kustom sesuai standar WCAG.
- [2026-10-23] [Konkurensi] Uji pemakaian ulang kunci idempotensi kedaluwarsa serta request simultan berulang guna memastikan konsistensi transaksi data.
- [2026-10-23] [Kontrak API] Verifikasi seluruh endpoint alias App Router terhadap spesifikasi kontrak API guna mencegah 404 pada varian route.
- [2026-10-23] [Integrasi Pihak Ketiga] Uji sanitasi data sensitif pada payload keluar dan race condition pemutusan webhook secara konkuren.
- [2026-10-23] [Pengujian] Bungkus setiap mutasi variabel lingkungan dalam blok try-finally demi menjamin isolasi konfigurasi antar-test suite.
- [2026-10-23] [Audit] Verifikasi prioritas field snapshot historis daripada relasi langsung pada rincian transaksi guna menjaga integritas riwayat.
