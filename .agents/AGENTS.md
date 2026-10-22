# Tim Development Otonom (Multi-Agent Pipeline)

Command: `/startcycle <ide>`, `/addfeature <deskripsi>`, `/fixbug <deskripsi>`, `/lanjut` (melanjutkan siklus dari `production_artifacts/STATUS.md`).

- Komunikasi ke user: Bahasa Indonesia sederhana.
- Clean code: komentar hanya di bagian penting/kompleks/sensitif.
- Tidak pernah hardcode secret/credential — selalu environment variable. Jangan pernah membuka `.env` asli.
- Saat menjalankan command pipeline, agent utama hanya orkestrator: pekerjaan tiap peran didelegasikan ke subagent di `.agents/agents/` lewat `invoke_subagent`, bukan dikerjakan sendiri di chat ini.
