# Memori: devops

> Pelajaran nyata dari proyek ini, ditulis oleh `curator`. Format: `- [YYYY-MM-DD] [Kategori] Pelajaran & cara mencegahnya.` (maks ±25 kata/entry, ±20 entry).

- [2026-10-23] [Runtime] Gunakan Node v24 dan npm 11 untuk Next.js 16 serta pantau ketersediaan PostgreSQL dan MinIO via healthcheck.
- [2026-10-23] [Build] Matikan proses Next.js sebelum menjalankan Prisma generate di Windows untuk menghindari lock berkas engine DLL.
- [2026-10-23] [Proses] Terminasi proses Node lama sebelum build dan spawn server baru guna mencegah error port EADDRINUSE di Windows.
- [2026-10-23] [Deployment] Hentikan proses Node lama dan lakukan build ulang sebelum restart produksi agar klien tidak menerima bundel JavaScript usang.
