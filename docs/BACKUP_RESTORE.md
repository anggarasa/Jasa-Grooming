# Prosedur Backup & Restore (Disaster Recovery Runbook)
# TampilKit Booking — Basic Booking Template

## 1. Tujuan & Sasaran SLA

Dokumen ini mendefinisikan Standard Operating Procedure (SOP) pencadangan (*backup*) dan pemulihan bencana (*disaster recovery*) untuk seluruh komponen data kritis aplikasi TampilKit Booking: basis data transaksional PostgreSQL, media berkas MinIO S3, dan kunci enkripsi aplikasi.

### Target Service Level Agreement (SLA)
- **RPO (Recovery Point Objective)**: $\le 1$ Jam (maksimum kehilangan data yang dapat ditoleransi dalam skenario bencana).
- **RTO (Recovery Time Objective)**: $\le 15$ Menit (maksimum durasi pemulihan sistem dari *cold backup* hingga *ready to serve traffic*).

---

## 2. Arsitektur Komponen Data

| Komponen | Lokasi Penyimpanan | Isi Data Kritis | Metode Backup |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | Port 5432 (`DATABASE_URL`) | Akun pengguna, bisnis, pengaturan, layanan, reservasi, histori status, outbox jobs | Logical dump (`pg_dump`) & WAL archiving |
| **MinIO Storage** | Bucket `tampilkit-booking` | Logo bisnis, foto portofolio galeri, foto katalog layanan | S3 Bucket Mirroring (`mc mirror`) |
| **Enkripsi & Rahasia** | Environment Variables | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_TOKEN_ENCRYPTION_KEY`, `GOOGLE_OAUTH_STATE_SECRET` | Secret Manager / Encrypted Vault |

---

## 3. Prosedur Pencadangan (Backup)

### 3.1. Backup Otomatis Basis Data (PostgreSQL)
Jalankan dump terkompresi dengan format kustom (*custom archive* `.dump`) yang menyertakan metadata tabel dan indeks:

```bash
# Set environment
export TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
export BACKUP_DIR="/var/backups/tampilkit"
mkdir -p $BACKUP_DIR

# Eksekusi pg_dump dengan kompresi gzip level 9
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE -F c -Z 9 -f "$BACKUP_DIR/db_backup_${TIMESTAMP}.dump"

# Hitung checksum SHA-256 untuk verifikasi integritas
sha256sum "$BACKUP_DIR/db_backup_${TIMESTAMP}.dump" > "$BACKUP_DIR/db_backup_${TIMESTAMP}.dump.sha256"
```

### 3.2. Backup Media Berkas (MinIO S3)
Gunakan MinIO Client CLI (`mc`) untuk menyinkronkan seluruh objek media ke lokasi backup sekunder:

```bash
# Konfigurasi alias MinIO
mc alias set localminio http://localhost:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# Sinkronisasi cermin (mirror) bucket media
mc mirror localminio/tampilkit-booking /var/backups/tampilkit/minio_objects/
```

### 3.3. Uji Coba Cepat Kesiapan Backup (Drill Script)
Jalankan skrip drill otomatis bawaan proyek untuk memverifikasi kesiapan ekspor, checksum, dan integritas relasional:

```bash
npm run backup:drill
```

---

## 4. Prosedur Pemulihan (Restoration Drill)

### 4.1. Verifikasi Checksum File Cadangan
Sebelum proses restore, selalu pastikan file backup tidak terkorupsi:

```bash
cd /var/backups/tampilkit
sha256sum -c "db_backup_${TIMESTAMP}.dump.sha256"
# Harus menghasilkan status: OK
```

### 4.2. Pemulihan Basis Data (PostgreSQL)
Lakukan restore ke basis data target yang bersih:

```bash
# 1. Bersihkan koneksi aktif ke DB (jika staging)
psql -h $PGHOST -U $PGUSER -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$PGDATABASE' AND pid <> pg_backend_pid();"

# 2. Eksekusi pg_restore dengan clean flag
pg_restore -h $PGHOST -U $PGUSER -d $PGDATABASE --clean --if-exists --no-owner --no-privileges "$BACKUP_DIR/db_backup_${TIMESTAMP}.dump"
```

### 4.3. Pemulihan Media Objek (MinIO)
Kembalikan seluruh objek media ke bucket aktif:

```bash
mc cp --recursive /var/backups/tampilkit/minio_objects/ localminio/tampilkit-booking/
```

### 4.4. Rekonsiliasi Migrasi Skema
Pastikan skema Prisma konsisten setelah restore:

```bash
npm run db:deploy
```

---

## 5. Lembar Verifikasi Integritas Pasca-Restore

Setelah proses pemulihan selesai, lakukan audit kepatuhan berikut:

1. **Uji Relasional (Zero Orphan)**:
   ```sql
   -- Pastikan tidak ada booking tanpa pelanggan
   SELECT count(*) FROM bookings b LEFT JOIN customers c ON b."customerId" = c.id WHERE c.id IS NULL;
   -- Nilai harus = 0

   -- Pastikan tidak ada sesi otentikasi tanpa pengguna
   SELECT count(*) FROM auth_sessions s LEFT JOIN users u ON s."userId" = u.id WHERE u.id IS NULL;
   -- Nilai harus = 0
   ```
2. **Kesiapan Enkripsi Token**:
   - Pastikan variabel `GOOGLE_TOKEN_ENCRYPTION_KEY` sama persis dengan lingkungan lama agar token refresh Google Calendar OAuth tetap dapat didekripsi via AES-256-GCM.
3. **Pemeriksaan Health Endpoint**:
   - Panggil `GET /api/health` dan verifikasi HTTP 200 OK dengan checks `{ database: "healthy", storage: "healthy" }`.
