# TAMPILKIT STUDIO — BASIC BOOKING TEMPLATE
## PHASE 01 — PROJECT FOUNDATION & INFRASTRUCTURE

You are a Senior Fullstack Engineer, Software Architect, and UI/UX Engineer responsible for building a production-oriented, reusable booking website template for TampilKit Studio.

**Your task is to IMPLEMENT the project directly in the current workspace. Do not stop at generating a plan, explanation, or pseudocode.**

Build the foundation, write real working code, execute installation and validation commands, resolve errors, and deliver a functioning application.

This project will initially represent a **Pet Grooming Booking Website**, but its architecture must be reusable for other appointment-based businesses.

All user-facing application text must use Bahasa Indonesia. Technical identifiers, source code, database model names, and developer documentation may use English.

---

# 1. PROJECT INFORMATION

- Project Name: TampilKit Booking
- Template Edition: Basic
- Example Business: Pet Grooming
- Application Type: Fullstack Web Application
- Architecture: Modular Monolith
- Initial Target: Local Development
- Package Manager: npm ONLY

The application should follow clean architecture principles without introducing unnecessary abstractions, distributed services, microservices, or excessive boilerplate.

## Mandatory Technology Stack

- Next.js App Router
- React
- TypeScript (strict mode)
- Node.js 24 LTS
- PostgreSQL
- Prisma ORM
- Tailwind CSS
- shadcn/ui
- Lucide React
- Zod
- React Hook Form
- JWT Access Token and Refresh Token (implemented in Phase 02)
- MinIO, already installed through Docker Desktop
- Google Calendar API (implemented in Phase 07)

**IMPORTANT:**

Use npm exclusively.
Do not use pnpm, Yarn, or Bun.
Use package-lock.json and npm scripts.
Install compatible stable package versions based on official documentation. Do not blindly copy older Next.js or Prisma configurations.
Do not replace PostgreSQL with SQLite or Prisma-hosted PostgreSQL.
Do not replace MinIO with Cloudinary, Firebase Storage, or another provider.
Do not implement Auth.js, NextAuth, Clerk, Supabase Auth, or Firebase Authentication.

---

# 2. PROJECT INITIALIZATION

Inspect the current workspace before changing anything.
If the project does not exist, initialize a Next.js application with:
- TypeScript
- App Router
- Tailwind CSS
- ESLint
- src directory
- @/* import alias

Suggested commands:
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" (or in root/current workspace if empty, without creating unnecessary monorepo or nested folder unless needed).

Configure:
- TypeScript strict mode
- ESLint
- formatting standards
- path aliases
- consistent naming conventions
- npm scripts
- environment variable management
- basic error handling

---

# 3. SHADCN/UI AND DESIGN SYSTEM

Install and configure shadcn/ui.
Foundational components:
- Button, Card, Input, Label, Badge, Separator, Skeleton, Alert, Dialog, Dropdown Menu, Sheet, Form, Select, Textarea, Table, Sonner

Visual Direction:
- Clean, Modern, Professional, Premium, Responsive, Minimalist
- Font: Geist
- Color System:
  - Primary Navy: #142C52
  - Secondary Soft Blue: #EAF2FF
  - Accent Teal: #0D9488
  - Background: #F8FAFC
  - Surface: #FFFFFF
  - Text: #0F172A
  - Muted text: #64748B

---

# 4. APPLICATION ARCHITECTURE

Structure:
- prisma/ (schema.prisma, migrations/, seed.ts)
- public/ (assets/)
- src/
  - app/ ((public)/page.tsx, (auth)/, (dashboard)/, api/health/route.ts, globals.css, layout.tsx)
  - components/ (ui/, common/, layouts/)
  - config/ (app.ts, env.ts, navigation.ts)
  - lib/ (prisma.ts, minio.ts, logger.ts, utils.ts)
  - modules/ (auth/, business/, services/, bookings/, availability/, customers/, storage/, calendar/)
  - hooks/, types/, constants/
- tests/
- docs/
- .env.example, .env.local, .gitignore, next.config.ts, package.json, README.md

---

# 5. POSTGRESQL CONFIGURATION

Connection:
DATABASE_URL="postgresql://postgres:anggara-sa@localhost:5432/tampilkit_booking?schema=public"

Requirements:
- Connect to existing local PostgreSQL server
- Create database tampilkit_booking if needed
- Prisma ORM singleton, connection pooling protection in dev hot reload
- Health check
- Safe seed command
- npm scripts

---

# 6. INITIAL DATABASE MODELS

- User (id, name, email unique, passwordHash, role enum [OWNER, ADMIN], isActive, createdAt, updatedAt)
- Business (id, name, slug, description, email, phone, address, timezone default Asia/Jakarta, logoObjectKey nullable, createdAt, updatedAt)
- BusinessSetting (id, businessId, bookingEnabled, currency default IDR, bookingIntervalMinutes, defaultBufferMinutes, createdAt, updatedAt)
- ServiceCategory (id, businessId, name, slug, description, isActive, createdAt, updatedAt)
- Service (id, businessId, categoryId, name, slug, description, durationMinutes, price Decimal, imageObjectKey, isActive, createdAt, updatedAt)
- Customer (id, businessId, name, email nullable, phone, createdAt, updatedAt)
- Pet (id, customerId, name, type, breed nullable, age nullable, notes nullable, createdAt, updatedAt)
- Booking (id, businessId, customerId, petId, serviceId, bookingCode, startAt, endAt, status enum [PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW], totalPrice, notes, createdAt, updatedAt)
- CalendarConnection (id, businessId, provider, calendarId, status, encrypted credentials nullable, createdAt, updatedAt)
- CalendarEventMapping (id, bookingId, calendarConnectionId, externalEventId, syncStatus, lastSyncedAt, createdAt, updatedAt)

---

# 7. MINIO STORAGE INTEGRATION

Existing MinIO via Docker Desktop:
- S3 compatible API
- Default settings: localhost:9000, useSSL: false, bucket: tampilkit-booking
- Utilities: init client, config validation, bucket existence/creation, health check, upload, delete, signed url, metadata
- Security: server-only, private bucket, validated file types/size, unique safe object keys

---

# 8. ENVIRONMENT CONFIGURATION

- Zod validation for active runtime env
- .env.example sanitized
- .env.local for local dev secrets

---

# 9. AUTHENTICATION FOUNDATION

- Prepared for Phase 02 (JWT, refresh token rotation, HttpOnly cookies)
- Not implementing actual login endpoints in Phase 01

---

# 10. APPLICATION UI FOUNDATION

- Polished public homepage (PawCare Grooming preview)
- Navbar, Hero, Services preview, CTA, Features, Footer
- Clean responsive layout in Bahasa Indonesia

---

# 11. HEALTH CHECK ENDPOINT

- GET /api/health returning status, application, database, storage, timestamp

---

# 12. SEED DATA

- Idempotent seed script: PawCare Grooming, categories, sample services, dev owner account (hashed password)

---

# 13. REQUIRED NPM SCRIPTS

- dev, build, start, lint, typecheck, db:generate, db:migrate, db:deploy, db:studio, db:seed, test

---

# 14. TESTING & VALIDATION

- Unit & integration tests (vitest): env, database, prisma, minio mocks, health endpoint, homepage render

---

# 15. DOCUMENTATION

- README.md, docs/ARCHITECTURE.md, docs/PHASE_01_REPORT.md
