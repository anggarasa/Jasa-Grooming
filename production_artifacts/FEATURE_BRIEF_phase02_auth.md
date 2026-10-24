# TAMPILKIT STUDIO — BASIC BOOKING TEMPLATE
## PHASE 02 — JWT AUTHENTICATION & ADMIN ACCESS

### 1. PROJECT CONTEXT
Project: TampilKit Booking
Edition: Basic Booking Template
Example Business: PawCare Grooming
Existing Tech: Next.js App Router, TypeScript strict, PostgreSQL, Prisma ORM, shadcn/ui, Tailwind CSS, Zod, React Hook Form, MinIO (Docker Desktop), npm.
Mandatory Auth Tech: JWT Access Token (jose), JWT Refresh Token (jose), Argon2id password hashing, PostgreSQL-backed refresh sessions, HttpOnly Secure Cookies, Server-side authorization.

Strict Rules:
- npm only.
- Do not install Auth.js, NextAuth, Clerk, Supabase Auth, Firebase Auth.
- Do not use localStorage or sessionStorage for tokens.
- Do not introduce an external session store (Redis, etc.).
- Do not change existing database technology. Do not break MinIO.
- Do not implement public customer registration.
- All user-facing copy in Bahasa Indonesia.
- Do not proceed to Phase 03 automatically.

### 2. REQUIRED OUTCOMES
- Admin login with email and password.
- Password validation using Argon2id.
- JWT Access Token generation (15m expiration, minimal claims: sub, sid, role, tv, type: access, iss, aud).
- JWT Refresh Token generation (7d expiration, separate secret, persisted hash).
- Secure cookie-based authentication (`tk_access`, `tk_refresh`, HttpOnly, secure in prod, SameSite: lax, path: /).
- PostgreSQL-backed refresh session storage (`AuthSession` & `RefreshTokenRecord` for reuse detection).
- Automatic refresh token rotation with reuse detection (revokes session family if reused).
- Handling benign concurrent refresh requests safely without token replay.
- Session revocation, Logout current device, Logout all devices.
- Current authenticated user endpoint (`GET /api/auth/me`).
- Basic Role-Based Access Control (`OWNER`, `ADMIN`).
- Protected dashboard layout & routes:
  - `/login` (clean shadcn/ui, reactive form, Bahasa Indonesia)
  - `/dashboard` (overview: welcome, business name, application status)
  - `/dashboard/profile` (current user info, name edit)
  - `/dashboard/security` (change password, link to sessions)
  - `/dashboard/sessions` (list sessions, revoke session, logout all)
- Password change (`POST /api/auth/change-password`, tokenVersion increment, session revocation).
- Audit logging (`AuthAuditLog`).
- Rate limiting for auth routes (login, refresh, change password).
- CSRF & origin validation utilities.
- Owner bootstrap script (`npm run auth` or cli script) for initial owner provisioning.
- Vitest security test suite.
- Documentation: update README, ARCHITECTURE, create docs/AUTHENTICATION.md and docs/PHASE_02_REPORT.md.
