# Laporan Bug Pengguna: Token akses tidak tersimpan / error fitur calendar

Gejala yang dilaporkan pengguna:
"Token akses tidak tersimpan. coba kamu cek apakah masih ada yang kurang di konfigurasinya ketika saya mencoba untuk fitur calender ini selalu saja error."

Masalah yang perlu diinvestigasi:
1. Cari teks "Token akses tidak tersimpan" di codebase.
2. Periksa callback OAuth Google: `src/app/api/integrations/google/callback/route.ts` dan `google-oauth.service.ts`.
3. Periksa penyimpanan token terenkripsi di `CalendarConnection`: `encryptedAccessToken`, `encryptedRefreshToken`. Mengapa refresh_token atau access_token tidak tersimpan saat koneksi dibuat, atau mengapa Google mengembalikan error saat flow integrasi kalender dipanggil?
4. Periksa apakah Google OAuth flow membutuhkan `access_type: 'offline'` dan `prompt: 'consent'` saat generate auth URL agar selalu memberikan `refresh_token` (jika user sudah pernah connect, Google tidak memberikan refresh_token lagi kecuali ada `prompt: 'consent'`).
5. Periksa rute `/api/integrations/google/sync` atau worker execution saat memproses sync job (`#EM6M7P`, `#2GWC71`), dan apa error yang terjadi saat koneksi/sinkronisasi berjalan.
