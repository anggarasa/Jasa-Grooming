# Manajemen Konflik Jadwal & Rekonsiliasi Google Calendar

Dokumentasi alur deteksi konflik, klasifikasi tipe konflik, serta antarmuka resolusi visual side-by-side pada **TampilKit Booking (PawCare Grooming)**.

---

## 1. Tipe Konflik Jadwal (`CalendarSyncConflict`)

Ketika data di Google Calendar berubah di luar kendali aplikasi PawCare, sistem mendeteksi ketidaksesuaian dan mencatatnya ke dalam model `CalendarSyncConflict`:

| Tipe Konflik | Deskripsi | Perilaku Sistem |
| :--- | :--- | :--- |
| `REMOTE_EVENT_CHANGED` | Waktu event reservasi PawCare diubah langsung oleh admin di aplikasi Google Calendar (bukan via dashboard PawCare). | Sistem **tidak mengubah** data booking PostgreSQL secara diam-diam. Konflik dicatat agar admin dapat memilih tindakan. |
| `REMOTE_EVENT_DELETED` | Event reservasi PawCare dihapus secara manual di Google Calendar. | Booking di PostgreSQL **tetap utuh**. Pemetaan ditandai konflik, dan admin diberikan opsi untuk membuat ulang event di Google. |
| `EXTERNAL_BUSY_OVERLAP` | Admin membuat agenda pribadi di Google Calendar yang bertabrakan dengan jadwal janji temu pelanggan yang telah terkonfirmasi sebelumnya. | Sistem menandai tumpang tindih waktu sebagai konflik operasional yang memerlukan perhatian admin. |
| `EVENT_VERSION_MISMATCH` | Urutan pembaruan remote tidak sesuai dengan versi mutasi booking lokal. | Rekonsiliasi otomatis menyelaraskan versi booking terbaru. |

---

## 2. Antarmuka Resolusi Konflik Visual Side-by-Side

Pada halaman `/dashboard/integrations/google-calendar`:
- Panel komparasi menampilkan kartu perbandingan berdampingan:
  - **Data PawCare (Lokal - Aksen Teal)**: Menampilkan nama layanan, kode booking, nama anabul, serta rentang waktu mulai dan selesai resmi toko.
  - **Data Google Calendar (Remote - Aksen Blue)**: Menampilkan waktu event yang terdeteksi di Google Calendar beserta etag.

### Tindakan Resolusi yang Tersedia:
1. **Pulihkan Event ke Google (`RESTORE_LOCAL_TO_GOOGLE`)**:
   - Menimpa data di Google Calendar dengan data resmi yang tercatat di basis data PawCare.
2. **Gunakan Data Lokal (`KEEP_LOCAL` / `MARK_RESOLVED`)**:
   - Mempertahankan integritas reservasi salon dan menandai konflik sebagai terselesaikan tanpa mengubah data operasional.
