---
name: addfeature
description: Orkestrator penambahan fitur baru ke proyek yang sudah berjalan. Hanya dipakai saat user mengetik /addfeature.
---

# /addfeature

Deskripsi fitur = teks setelah `/addfeature`. Kalau kosong, tanyakan fiturnya lalu berhenti.

## Aturan orkestrator (hemat token)

- Delegasikan tiap langkah lewat `invoke_subagent` ke subagent di `.agents/agents/`, lalu tunggu hasilnya sebelum lanjut. Subagent mulai dengan context kosong, jadi tugas yang kamu kirim harus berisi: command, deskripsi user, path file yang perlu dibaca, dan instruksi langkah itu. Kirim **path**, bukan isi file atau salinan percakapan.
- Jangan membaca sendiri kode, spesifikasi, atau hasil kerja subagent. Cukup pakai balasan ringkas mereka. Itu yang membuat chat ini tetap kecil.
- Setelah setiap langkah, perbarui `production_artifacts/STATUS.md` dengan edit kecil (buat kalau belum ada):
  ```
  # Status Siklus
  - Command: /<command> — <deskripsi singkat user>
  - Dokumen: <path spesifikasi/bug report>
  - Selesai: <langkah yang sudah selesai, mis. 0 scout, 1 pm (disetujui)>
  - Berikutnya: <nomor + nama langkah berikutnya>
  - File berubah: <gabungan daftar dari engineer>
  - Catatan untuk curator: <gabungan catatan dari tiap agent>
  ```
- Ke user: ringkasan pendek per langkah dalam Bahasa Indonesia sederhana — jangan mengulang isi dokumen.

## Langkah

0. **scout** — konfirmasi konteks proyek lewat fast-path (jangan minta full scan).
1. **pm** — tulis `production_artifacts/Feature_Spec_<nama_fitur>.md` (spek khusus fitur ini, bukan spek aplikasi penuh).
   Tampilkan ringkasan + pertanyaan terbuka, lalu **BERHENTI** dan minta "Setuju" atau revisi (user juga bisa membuka chat baru dan mengetik `/lanjut Setuju`). Revisi → panggil pm lagi hanya dengan catatan revisinya.
2. **designer** — hanya kalau `Perubahan UI=ya`: tambah/sesuaikan token di `design-tokens.json` yang ada, jangan buat design system baru. Tanpa review terpisah kecuali perubahannya besar.
3. **Engineer** sesuai baris `Butuh:` (backend dulu kalau kontrak API berubah). Berikan path Feature_Spec — bukan Technical_Specification penuh.
4. **qa** — berikan gabungan `File berubah`; tegaskan: audit HANYA file itu + caller langsungnya. Maksimal 1 putaran perbaikan ulang.
5. **devops** — HANYA kalau ada dependency baru, variabel env baru, migrasi database, atau perubahan config build/run. Kalau tidak, lewati.
6. **curator** — sama seperti /startcycle; lewati kalau semua catatan kosong dan tidak ada temuan Tinggi/Sedang.
7. **Ringkasan akhir**: fitur yang ditambahkan, file yang berubah, status QA, pelajaran yang disimpan. Isi `Berikutnya: -` di `STATUS.md`.
