# Laporan Perbaikan Bug: Penolakan Git Push oleh GitHub Push Protection (Rahasia Google OAuth di .env.example)

## 1. Gejala (Symptoms)
- Perintah `git push -f origin v1` ditolak oleh remote GitHub dengan status `[remote rejected] v1 -> v1 (push declined due to repository rule violations)` dan kode error `GH013`.
- GitHub Push Protection mendeteksi adanya kredensial rahasia asli pada riwayat komit `b36479d948edc4bbfec6fa256f073cbb758fee73`:
  - `path: .env.example:24` (Google OAuth Client ID)
  - `path: .env.example:25` (Google OAuth Client Secret)

---

## 2. Akar Masalah (Root Cause)
- Berkas template lingkungan `.env.example` secara tidak sengaja terisi oleh nilai kredensial Google OAuth nyata (`916790710623-...` dan `GOCSPX-...`) saat tahap penambahan fitur Google Calendar pada komit terdahulu.
- Walaupun berkas `.env` dan `.env.local` telah di-ignore oleh `.gitignore`, berkas `.env.example` terlacak oleh Git dan ter-commit ke dalam riwayat repositori.
- GitHub Secret Scanning & Push Protection secara otomatis memblokir push apapun yang memuat format Client Secret Google OAuth aktif demi mencegah kebocoran kredensial ke publik.

---

## 3. Tindakan Perbaikan (Resolution Steps)
1. **Rebase Interaktif & Pembersihan Riwayat Komit**:
   - Menjalankan rebase interaktif dari basis komit (`git rebase -i ba00ea1`) dengan mode `edit` pada komit yang memuat rahasia.
   - Mengganti nilai rahasia di `.env.example` dengan placeholder aman:
     ```env
     GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
     GOOGLE_CLIENT_SECRET="your-google-client-secret"
     ```
   - Meng-amend komit tersebut (`git commit --amend --no-edit`) dan melanjutkan rebase (`git rebase --continue`) ke seluruh komit turunannya (`739d836` dan `62b5a11`).
2. **Audit Verifikasi Riwayat Git**:
   - Memastikan tidak ada sisa string kredensial (`git log -S "916790710623"` dan `git log -S "GOCSPX"`) di seluruh riwayat branch `v1`.
3. **Eksekusi Push Ulang**:
   - Menjalankan `git push -f origin v1` dan push berhasil diterima 100% oleh GitHub tanpa penolakan.

---

## 4. Cara Mencegah di Masa Depan
- Berkas `.env.example` HANYA boleh berisi nama variabel dengan nilai placeholder/dummy (misalnya `your-key-here` atau `dummy_token`). Jangan pernah menyalin isi `.env` aktif langsung ke `.env.example`.
- Tambahkan aturan permanen pada knowledge base DevOps & Backend agar selalu memeriksa isi `.env.example` sebelum melakukan commit.
