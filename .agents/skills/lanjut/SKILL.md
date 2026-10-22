---
name: lanjut
description: Melanjutkan siklus pipeline yang tertunda (menunggu persetujuan, pindah ke chat baru, atau kuota habis di tengah jalan) berdasarkan production_artifacts/STATUS.md. Hanya dipakai saat user mengetik /lanjut.
---

# /lanjut

Teks setelah `/lanjut` = jawaban user untuk langkah yang tertunda (mis. "Setuju" atau catatan revisi). Boleh kosong.

1. Baca `production_artifacts/STATUS.md`. Kalau file tidak ada atau `Berikutnya: -`, bilang tidak ada siklus yang tertunda, sarankan `/startcycle`, `/addfeature`, atau `/fixbug`, lalu berhenti.
2. Baca `.agents/skills/<command>/SKILL.md` sesuai command di STATUS.md, lalu lanjutkan dari langkah `Berikutnya` dengan semua aturan di skill itu.
3. Jangan mengulang langkah yang sudah tercatat selesai, dan jangan memanggil scout lagi kecuali langkah berikutnya memang scout.
4. Kalau langkah yang tertunda adalah persetujuan: teks "Setuju"/"Approved" → catat disetujui dan lanjut; teks lain → anggap revisi dan jalankan putaran revisi; kosong → tampilkan lagi ringkasan singkat dari STATUS.md dan minta jawaban.
