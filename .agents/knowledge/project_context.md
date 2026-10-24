# Project Context (Jangka Panjang)

> File ini diperbarui otomatis oleh skill `onboarding/read_project.md` di setiap siklus.
> Beda dengan `production_artifacts/Project_Context.md` (snapshot terbaru), file ini adalah riwayat kumulatif yang terus disempurnakan.

## Status Proyek
- Proyek berjalan (*Existing / Brownfield*), Next.js Fullstack Modular Monolith untuk sistem reservasi perawatan hewan peliharaan (*PawCare Grooming*).

## Tech Stack
- **Framework**: Next.js 16.4.2 App Router (Turbopack, TypeScript strict mode)
- **Styling**: Tailwind CSS v4, CSS Custom Properties, Radix UI Primitives, Lucide Icons, Sonner
- **Database**: PostgreSQL dengan Prisma ORM 6.4.1
- **Auth**: Custom JWT (Access/Refresh rotation), Argon2id / bcryptjs
- **Media**: MinIO S3-compatible object storage via Docker
- **Integrasi**: Google Calendar API v3 (OAuth2, webhook sync, conflict resolver)
- **Pengujian**: Vitest 5.0.5, npm-only

## Struktur Folder & Pola Arsitektur
- Pola modular layer-first: `src/app` (routing/UI), `src/components` (reusable UI), `src/modules` (business logic domain), `src/lib` (infrastructure & clients).
- Desain sistem dikontrol via token terpusat di `src/app/globals.css`.

## Konvensi Tim
- Seluruh antarmuka publik dan dashboard dalam Bahasa Indonesia.
- Jangan hardcode warna/spacing langsung; gunakan design tokens.
- Pengujian basis data wajib diisolasi menggunakan fixture (`test-fixture-biz-*`) dan dibersihkan di `afterAll`.
- Hindari penggunaan icon/emoji biasa untuk identitas logo brand; gunakan visual logo vektor/SVG kustom.

## Riwayat Perubahan Penting
- **[2026-10-24]**: Siklus pembaruan desain UI (modernisasi visual, palet warna berdaya tarik tinggi 60-30-10, dan pembuatan logo website vektor murni non-icon).
