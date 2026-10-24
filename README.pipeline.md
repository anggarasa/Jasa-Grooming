# 🚀 Pipeline Developer Otonom Multi-Agent — untuk Antigravity (v2, hemat token)

Tim development AI otonom (Scout, PM, Designer, Frontend, Backend, Mobile, QA, DevOps, Curator) yang tech-agnostic dan belajar dari setiap siklus kerja.

**v2** ditulis ulang supaya kuota tidak cepat habis. Pipeline sekarang memakai fitur native Antigravity, yaitu **custom subagents** dan **skills**, menggantikan pola "satu agent berperan sebagai semua persona dalam satu chat".

## Kebutuhan

Versi Antigravity yang sudah mendukung **custom subagents** (`.agents/agents/`) dan **skills** (`.agents/skills/<nama>/SKILL.md`).

> ⚠️ **Workflows (`.agents/workflows/`) dihentikan Antigravity pada 1 November 2026.** Setelah tanggal itu, `/startcycle` dkk. versi v1 tidak bisa dipanggil lagi. v2 sudah memakai skills.

## Instalasi (proyek baru)

1. Copy `.agents/`, `production_artifacts/`, dan `app_build/` ke root proyek.
2. Buka chat baru di workspace proyek, lalu ketik salah satu command:
   ```
   /startcycle Saya butuh aplikasi kasir untuk toko retail, ada web admin dan aplikasi mobile untuk kasir
   /addfeature Tambahkan fitur export laporan penjualan ke Excel
   /fixbug Tombol checkout tidak merespon saat keranjang lebih dari 10 item
   /lanjut Setuju
   ```

Commit `.agents/` ke git, termasuk `.agents/memory/`. Isinya memori bersama tim, bukan data pribadi.

## Upgrade dari v1

1. **Pindahkan pelajaran lama** (kalau Section B knowledge base Anda sudah berisi entry): salin entry Section B tiap file ke `.agents/memory/<agent>.md` (`frontend_knowledge.md` → `frontend.md`, dst). Section A tidak perlu dipindahkan karena sudah dirangkum ke file agent.
2. **Hapus file v1** supaya tidak bentrok dan tidak ikut terbaca:
   - `.agents/agents.md`
   - `.agents/workflows/`
   - `.agents/skills/onboarding/`, `pm/`, `design/`, `frontend/`, `backend/`, `mobile/`, `qa/`, `devops/`, `curator/`
   - `.agents/knowledge/`
   - `production_artifacts/Project_Context.md` (diganti `.agents/memory/scout.md`)
3. Copy `.agents/` v2.

## Struktur

```
.agents/
├── AGENTS.md                 # aturan global (selalu aktif), SENGAJA ±150 token
├── agents/                   # 9 subagent, masing-masing punya context sendiri
│   ├── scout.md              # model: flash
│   ├── pm.md
│   ├── designer.md
│   ├── frontend.md
│   ├── backend.md
│   ├── mobile.md
│   ├── qa.md
│   ├── devops.md             # model: flash
│   └── curator.md            # model: flash
├── skills/                   # slash command orkestrator
│   ├── startcycle/SKILL.md
│   ├── addfeature/SKILL.md
│   ├── fixbug/SKILL.md
│   └── lanjut/SKILL.md       # BARU: lanjutkan siklus di chat baru
└── memory/                   # pengganti Section B knowledge (self-learning)
    ├── scout.md              # konteks proyek (pengganti Project_Context.md)
    └── pm.md, designer.md, frontend.md, backend.md, mobile.md, qa.md, devops.md
production_artifacts/         # STATUS.md, spesifikasi, design tokens, Bug_Report, QA_Findings
app_build/                    # lokasi kode untuk proyek baru
```

## Kenapa v1 boros, dan apa yang diubah

| Penyebab boros di v1 | Perubahan di v2 |
| --- | --- |
| **Satu chat untuk semua peran.** Spek, seluruh kode yang ditulis, hasil audit, dan log terminal menumpuk di satu context, lalu dikirim ulang ke model di **setiap** langkah. Langkah QA dan DevOps di akhir siklus jadi yang paling mahal. | Tiap peran berjalan sebagai **subagent dengan context kosong sendiri**. Chat utama hanya berisi skill orkestrator + balasan ringkas (maks ±15 baris) dari tiap subagent. |
| **±44 KB instruksi** (`agents.md` + 9 skill peran + 7 knowledge base, ±11 ribu token) dibaca ke context yang sama selama satu siklus, lalu ikut terkirim ulang di setiap langkah sesudahnya. | Chat utama hanya memuat ±3,6 KB (AGENTS.md + skill command). Instruksi tiap peran (±2–3 KB) hanya dimuat di context subagent itu sendiri. |
| **Section A knowledge** berisi banyak best practice umum yang sudah dikuasai model ("pakai semantic HTML", "test pyramid"). | Dirangkum jadi "standar wajib" pendek di tiap file agent. Yang dipertahankan hanya aturan yang sering dilewati model. |
| **Semua langkah memakai model yang sama**, termasuk scan proyek, deploy, dan curator. | `scout`, `devops`, dan `curator` memakai `model: flash`. Peran yang butuh penalaran tetap `inherit`. |
| **Engineer & QA menulis ulang file utuh** ("overwrite file yang bermasalah"). | Edit terarah (`replace_file_content`). Tulis file utuh hanya untuk file baru. |
| **Log terminal & dev server** masuk penuh ke context. | Output command dibatasi (`tail -n 30/40`). Server dijalankan di background dan dicek lewat port/HTTP status. |
| **PM bertanya dulu, lalu menulis spek, lalu minta approval.** Itu dua putaran. Revisi menulis ulang seluruh dokumen. | Pertanyaan terbuka digabung dengan permintaan persetujuan (satu putaran). Revisi hanya mengedit bagian terkait. Spek dibatasi ±120 baris (fitur ±50 baris). |
| **`/fixbug`**: QA investigasi → engineer membaca ulang kode yang sama → QA verifikasi. | Engineer langsung mereproduksi dan memperbaiki dalam satu context. QA hanya dipanggil untuk perbaikan berisiko (auth/data/pembayaran, >2 file, atau belum terverifikasi). |
| **Curator selalu jalan** dan membaca semua knowledge base. | Curator hanya membaca catatan dari agent + QA_Findings/Bug_Report. Di `/startcycle` dan `/addfeature` curator dilewati kalau tidak ada pelajaran baru. |
| `QA_Findings.md` dan `project_context.md` terus bertambah. | `QA_Findings.md` & `Bug_Report.md` ditimpa tiap siklus (riwayat ada di git). Konteks proyek cukup satu file (`memory/scout.md`, maks ±50 baris). |
| Siklus panjang harus selesai di satu chat. | `production_artifacts/STATUS.md` + `/lanjut`. Setelah menyetujui spek, atau kalau chat sudah panjang atau kuota habis, buka chat baru dan ketik `/lanjut Setuju`. Tidak ada langkah yang diulang. |

## Tips pemakaian supaya kuota awet

1. **Satu command = satu chat.** Mulai chat baru untuk setiap `/startcycle`, `/addfeature`, `/fixbug`. Pakai `/lanjut` untuk meneruskan siklus yang tertunda di chat baru.
2. **Pilih model chat utama yang hemat.** Chat utama hanya mengorkestrasi, jadi tidak perlu model paling mahal. Subagent ber-`model: inherit` ikut model ini. Model "thinking" kelas atas (mis. Opus) menghabiskan kuota jauh lebih cepat.
3. **Deskripsi yang spesifik.** `/fixbug Tombol checkout di src/cart/Checkout.tsx tidak merespon saat item > 10` jauh lebih murah daripada "checkout error". Tempel pesan error kalau ada.
4. Kalau Antigravity Anda punya pilihan mode Planning/Fast, pakai **Fast** untuk `/fixbug` dan `/lanjut`. Pipeline ini sudah punya dokumen rencana sendiri (spesifikasi), jadi rencana tambahan dari mode Planning sering dobel.
5. Kalau tidak butuh review desain, tulis "lanjut tanpa review desain" saat menyetujui spek. Itu menghemat satu putaran.

## Kustomisasi

- **Model per subagent**: ubah `model:` (`inherit`, `flash`, `pro`) di `.agents/agents/*.md`. Contoh: `designer` atau `qa` ke `flash` untuk lebih hemat, atau engineer ke `pro` untuk kualitas lebih tinggi.
- **Aturan permanen**: edit badan file di `.agents/agents/*.md`. Curator tidak pernah mengubahnya.

## Troubleshooting

- **Subagent macet / tidak pernah selesai.** Dokumentasi Antigravity menyebut nama tool yang salah eja di `tools:` bisa membuat subagent hang. Daftar tool di file agent memakai nama standar (`view_file`, `list_dir`, `find_by_name`, `grep_search`, `run_command`, `write_to_file`, `replace_file_content`, `multi_replace_file_content`). Kalau versi Antigravity Anda memakai nama lain, sesuaikan atau hapus tool yang tidak dikenali.
- **devops gagal install/menjalankan server.** Subagent default berjalan dengan `commandExecutionPolicy: sandbox`. Kalau sandbox memblokir akses jaringan/port di mesin Anda, tambahkan `commandExecutionPolicy` yang sesuai di `devops.md` (pilihan: `off`, `auto`, `eager`, `sandbox`).
- **Command tidak muncul saat mengetik `/`.** Pastikan foldernya `.agents/skills/<nama>/SKILL.md` (huruf besar `SKILL.md`).

## Batasan

- Ini bukan cara membuat kuota tidak terbatas. Pipeline ini mengurangi token yang terbuang (context menumpuk, instruksi dibaca berulang, model mahal untuk tugas ringan), supaya kuota dipakai untuk kerja yang produktif.
- Setiap subagent tetap memakan token: ia membaca file yang dibutuhkannya sendiri karena tidak mewarisi context chat utama.
