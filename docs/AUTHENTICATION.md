# Dokumentasi Keamanan & Otentikasi: Phase 02 (JWT & Admin Access)

Dokumen ini menjelaskan arsitektur keamanan, lifecycle token, manajemen sesi, mitigasi kerentanan OWASP, dan panduan teknis otentikasi pada proyek **TampilKit Booking**.

---

## 1. Arsitektur Otentikasi

Sistem otentikasi Phase 02 mengadopsi pola **Dual-Token State-Backed** yang aman tanpa ketergantungan pada vendor auth eksternal:
- **Hashing Kredensial**: Menggunakan algoritma **Argon2id** (`@node-rs/argon2`) dengan standar OWASP Memory-hard cost.
- **Short-Lived Access Token**: JWT dengan masa berlaku 15 menit menggunakan secret `JWT_ACCESS_SECRET` independen.
- **Long-Lived Refresh Token**: JWT dengan masa berlaku 7 hari menggunakan secret `JWT_REFRESH_SECRET` independen, disimpan hanya representasi *cryptographic hash*-nya di PostgreSQL.
- **Penyimpanan Klien**: Kredensial token **tidak pernah** disimpan di `localStorage` atau `sessionStorage`. Seluruh token dikirimkan dan disimpan via **HttpOnly Secure Cookies** (`tk_access` dan `tk_refresh`).
- **Verifikasi Status Server**: Setiap permintaan yang dilindungi (`requireAuth`) memvalidasi status akun user aktif (`isActive`), validitas `tokenVersion`, dan keberadaan sesi di basis data.

---

## 2. Model Data Sesi & Deteksi Token Reuse

Struktur basis data relasional untuk sesi (`prisma/schema.prisma`):

```prisma
model AuthSession {
  id               String               @id @default(cuid())
  userId           String
  familyId         String               @default(cuid())
  currentTokenJti  String
  refreshTokenHash String
  userAgent        String?
  ipAddress        String?
  createdAt        DateTime             @default(now())
  lastUsedAt       DateTime             @default(now())
  expiresAt        DateTime
  revokedAt        DateTime?
  revokedReason    String?
  user             User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenRecords     RefreshTokenRecord[]
}

model RefreshTokenRecord {
  id            String       @id @default(cuid())
  sessionId     String
  jti           String       @unique
  tokenHash     String
  issuedAt      DateTime     @default(now())
  expiresAt     DateTime
  consumedAt    DateTime?
  revokedAt     DateTime?
  replacedByJti String?
  session       AuthSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

model AuthAuditLog {
  id        String   @id @default(cuid())
  userId    String?
  eventType String
  ipAddress String?
  userAgent String?
  metadata  Json?
  createdAt DateTime @default(now())
}
```

### Mekanisme Deteksi Token Reuse (Replay Protection)
1. Setiap kali refresh token digunakan pada endpoint `POST /api/auth/refresh`, token dicatat sebagai `consumedAt` dan digantikan oleh pasangan JTI baru (`replacedByJti`).
2. **Mitigasi Race Condition Konkuren**: Request refresh dari tab browser yang sama yang terjadi dalam rentang *grace period* 30 detik diizinkan menerima token penerus yang sama tanpa dianggap serangan pencurian.
3. **Pencabutan Sesi Satu Keluarga (*Family Revocation*)**: Jika token yang telah melewati grace period atau telah dicabut dicoba dikirim kembali, sistem mengidentifikasi insiden sebagai serangan pencurian token. Seluruh sesi dengan `familyId` yang sama langsung dicabut (`revokedAt = now()`), event dicatat ke `AuthAuditLog` sebagai `TOKEN_REUSE_DETECTED`, dan cookie otentikasi dihapus seketika.

---

## 3. Strategi Cookie & Pertahanan CSRF

1. **Atribut Cookie**:
   - `tk_access`: `HttpOnly: true`, `SameSite: Lax`, `Path: /`, `Max-Age: 900` (15m), `Secure: true` (pada production).
   - `tk_refresh`: `HttpOnly: true`, `SameSite: Lax`, `Path: /api/auth`, `Max-Age: 604800` (7d), `Secure: true` (pada production).
2. **Proteksi CSRF**:
   - Setiap mutasi state (POST, PUT, PATCH, DELETE) pada rute otentikasi divalidasi melalui utilitas `validateCsrfRequest(request)`.
   - Header `Origin` atau `Referer` diverifikasi ketat terhadap origin aplikasi (`NEXT_PUBLIC_APP_URL`). Permintaan lintas-domain (cross-origin) yang tidak sah ditolak dengan status HTTP 403.

---

## 4. Role-Based Access Control (RBAC) & Proteksi Rute

### Peran (Roles):
- **`OWNER`**: Akses penuh ke seluruh fitur administratif, manajemen akun admin, pencabutan sesi, dan pengelolaan profil toko.
- **`ADMIN`**: Akses ke dashboard operasional, pengelolaan sesi mandiri, ubah kata sandi, dan pembaruan profil sendiri.

### Penggunaan Helper Otorisasi Server-Side:
```typescript
import { requireAuth, requireRole, assertOwner } from "@/lib/auth/server";

// Memastikan user terotentikasi & sesi aktif
const user = await requireAuth();

// Membatasi akses peran
await requireRole(["OWNER", "ADMIN"]);

// Membatasi akses khusus Owner
await assertOwner();
```

---

## 5. Ringkasan Endpoint API Otentikasi

| Endpoint | Method | Deskripsi | Proteksi |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | Login kredensial admin | Rate Limit, Zod Sanitasi |
| `/api/auth/refresh` | POST | Rotasi token refresh | Cookie HttpOnly, Concurrency Safe |
| `/api/auth/logout` | POST | Logout perangkat aktif saat ini | CSRF Guard, Revoke Session |
| `/api/auth/logout-all` | POST | Logout dari semua perangkat | requireAuth, CSRF Guard |
| `/api/auth/me` | GET / PATCH | Ambil & update profil admin | requireAuth, Sanitasi Response |
| `/api/auth/sessions` | GET / POST | Daftar sesi aktif & status | requireAuth |
| `/api/auth/sessions/[id]` | DELETE | Cabut sesi perangkat tertentu | requireAuth, CSRF Guard |
| `/api/auth/change-password` | POST | Ubah password & rotasi version | requireAuth, Rate Limit |

---

## 6. Provisi Akun Pemilik (Owner Bootstrap CLI)

Untuk inisialisasi akun Owner awal tanpa hardcode kata sandi:
```bash
npm run auth:provision -- --email="owner@pawcare.com" --name="PawCare Owner" --password="YourSecurePassword123!"
```
Skrip ini aman, idempotent, dan menolak password yang tidak memenuhi standar kebijakan keamanan (minimal 12 karakter).
