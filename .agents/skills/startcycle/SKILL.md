---
name: startcycle
description: Orkestrator siklus pengembangan penuh dari ide baru (web, backend, mobile, atau kombinasinya). Hanya dipakai saat user mengetik /startcycle.
---

# /startcycle

Ide user = teks setelah `/startcycle`. Kalau kosong, tanyakan idenya lalu berhenti.

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

0. **scout** — konteks proyek.
1. **pm** — tulis `production_artifacts/Technical_Specification.md` dari ide user.
   Tampilkan ringkasan pm + pertanyaan terbukanya, lalu **BERHENTI**. Minta user membalas "Setuju" atau memberi revisi (boleh juga langsung mengedit file spesifikasinya). Sampaikan juga: kalau chat sudah panjang, user bisa membuka chat baru lalu mengetik `/lanjut Setuju` atau `/lanjut <revisi>`.
   Revisi → panggil pm lagi hanya dengan catatan revisinya (pm mengedit bagian terkait, bukan menulis ulang). Ulangi sampai disetujui.
2. **designer** — hanya kalau ada Frontend Web atau Mobile. Tampilkan ringkasan dan minta persetujuan singkat, kecuali user sudah bilang "lanjut tanpa review desain".
3. **Engineer** sesuai baris `Butuh:` dari pm. Backend dulu kalau ada; teruskan kontrak API final dari backend ke frontend/mobile (frontend & mobile boleh dipanggil bersamaan).
4. **qa** — berikan gabungan `File berubah` dari semua engineer + path spesifikasi. Temuan yang diserahkan qa ke engineer → panggil engineer itu dengan daftar temuannya saja, lalu minta qa verifikasi ulang singkat. Maksimal 1 putaran ulang; sisanya laporkan ke user.
5. **devops** — install, jalankan, verifikasi.
6. **curator** — berikan semua `Catatan untuk curator` + path `QA_Findings.md`. Lewati kalau semua catatan kosong dan qa tidak menemukan temuan Tinggi/Sedang.
7. **Ringkasan akhir** ke user: apa yang dibangun, lokasi, cara menjalankan/link lokal, temuan QA penting, pelajaran yang disimpan. Isi `Berikutnya: -` di `STATUS.md`. Sarankan memulai chat baru untuk command berikutnya.
