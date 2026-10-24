# Panduan Konfigurasi Google Cloud & OAuth 2.0

Dokumentasi konfigurasi proyek Google Cloud Platform (GCP), aktivasi Google Calendar API, dan pembuatan kredensial OAuth 2.0 Web Application untuk **TampilKit Booking (PawCare Grooming)**.

---

## 1. Persiapan Proyek Google Cloud

1. Masuk ke [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru atau pilih proyek yang sudah ada:
   - Nama proyek: `PawCare Grooming Booking` (atau sesuai nama bisnis).
3. Buka menu **APIs & Services** > **Library**.
4. Cari **Google Calendar API**, lalu klik tombol **Enable**.

---

## 2. Konfigurasi OAuth Consent Screen

1. Buka menu **APIs & Services** > **OAuth consent screen**.
2. Pilih jenis pengguna (*User Type*):
   - **External**: Untuk pengujian atau rilis publik.
3. Lengkapi informasi aplikasi:
   - **App name**: `PawCare Grooming`
   - **User support email**: Email pemilik/administrator.
   - **Developer contact information**: Email pengembang.
4. Pada tahap **Scopes**, tambahkan izin (*scopes*) kalender terbatas:
   - `https://www.googleapis.com/auth/calendar.events`: Membuat, membaca, memperbarui, dan menghapus event reservasi yang dikelola.
   - `https://www.googleapis.com/auth/calendar.readonly`: Menemukan daftar kalender yang dapat diakses dan membaca ketersediaan slot (FreeBusy).
5. Pada tahap **Test users** (jika mode *Testing*):
   - Daftarkan alamat Gmail/Google Workspace pemilik salon yang akan dihubungkan ke sistem.

---

## 3. Pembuatan Kredensial OAuth 2.0

1. Buka menu **APIs & Services** > **Credentials**.
2. Klik **Create Credentials** > **OAuth client ID**.
3. Pilih Application type: **Web application**.
4. Masukkan nama: `PawCare Web Client`.
5. Tambahkan **Authorized redirect URIs**:
   - Pengembangan lokal: `http://localhost:3000/api/integrations/google/callback`
   - Produksi: `https://DOMAIN_ANDA.com/api/integrations/google/callback`
6. Klik **Create** dan salin:
   - `Client ID`
   - `Client Secret`

---

## 4. Konfigurasi Variabel Lingkungan (`.env.local`)

Tambahkan variabel berikut ke berkas `.env.local`:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/integrations/google/callback"

# Enkripsi & Keamanan OAuth State
GOOGLE_OAUTH_STATE_SECRET="kunci-acak-minimal-32-karakter-untuk-state-hmac"
GOOGLE_TOKEN_ENCRYPTION_KEY="kunci-hex-32-byte-untuk-enkripsi-aes-256-gcm"

# Pengaturan Sinkronisasi & Webhook
GOOGLE_CALENDAR_SYNC_ENABLED="true"
GOOGLE_CALENDAR_WEBHOOK_URL="https://DOMAIN_ANDA.com/api/webhooks/google-calendar"
GOOGLE_CALENDAR_WEBHOOK_TOKEN="token-verifikasi-channel-webhook-acak"

GOOGLE_CALENDAR_SYNC_INTERVAL_MINUTES="5"
GOOGLE_CALENDAR_RETRY_MAX_ATTEMPTS="5"
GOOGLE_CALENDAR_FREEBUSY_TIMEOUT_MS="5000"
```

> **Catatan Keamanan**: Aplikasi dirancang untuk tetap dapat dijalankan (*graceful fallback*) meskipun kredensial Google belum diisi. Mode ketersediaan akan otomatis menggunakan basis data PostgreSQL lokal jika Google Calendar belum terhubung.
