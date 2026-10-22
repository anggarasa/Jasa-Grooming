---
name: fixbug
description: Orkestrator perbaikan bug yang dilaporkan user di proyek yang sudah berjalan. Hanya dipakai saat user mengetik /fixbug.
---

# /fixbug

Deskripsi bug = teks setelah `/fixbug` (termasuk error/log yang ditempel user). Kalau kosong, tanyakan gejalanya lalu berhenti.

Alur paling ringan: tidak ada pm/designer. Kalau ternyata bug mengungkap masalah spesifikasi/desain yang lebih besar, jelaskan ke user dan sarankan `/addfeature`.

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

0. **scout** — fast-path saja.
1. **Engineer** di layer tempat gejala muncul (**frontend**/**mobile** untuk masalah tampilan/interaksi, **backend** untuk error API/data). Kirim deskripsi bug apa adanya + instruksi "mode perbaikan bug". Engineer mereproduksi, mencari root cause, memperbaiki, dan menulis `Bug_Report.md`. Kalau engineer melaporkan akar masalah di layer lain, panggil engineer layer itu dengan path `Bug_Report.md`.
2. **qa** — HANYA kalau perbaikan menyentuh auth/keamanan/pembayaran/data, mengubah lebih dari 2 file, atau engineer tidak bisa memverifikasi perbaikannya. Scope: `File berubah` saja.
3. **devops** — HANYA kalau perbaikan mengubah dependency, env, atau config build/run.
4. **curator** — WAJIB (bug nyata = pelajaran prioritas). Berikan path `Bug_Report.md` + catatan curator.
5. **Ringkasan akhir**: penyebab bug dalam bahasa awam, file yang diperbaiki, cara verifikasinya, pelajaran yang disimpan. Isi `Berikutnya: -` di `STATUS.md`.
