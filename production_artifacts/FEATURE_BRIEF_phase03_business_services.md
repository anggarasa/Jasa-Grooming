# TAMPILKIT STUDIO — BASIC BOOKING TEMPLATE
# PHASE 03 — BUSINESS SETTINGS, SERVICE MANAGEMENT & MINIO MEDIA

## 1. PROJECT CONTEXT & RULES
- Project: TampilKit Booking (PawCare Grooming)
- Stack: Next.js App Router, TypeScript strict, React, PostgreSQL, Prisma ORM, JWT (jose, Argon2id), shadcn/ui, Tailwind CSS, React Hook Form, Zod, MinIO (Docker Desktop), npm.
- Preserve Phase 01 & Phase 02 features (do not break auth or minio, do not install third-party auth libraries).
- User-facing text: Bahasa Indonesia.

## 2. MODULES & OBJECTIVES
A. Business Profile Management (`/dashboard/settings/business`, `GET /api/business`, `PATCH /api/business`)
   - Business Name, Slug, Description, Email, Phone, WhatsApp, Full Address, City, Province, Postal Code, Google Maps URL, Timezone (Asia/Jakarta), Business Logo, Business Status.
   - Owner only for profile updates.

B. Business Operating Hours (`/dashboard/settings/hours`, `GET /api/business/hours`, `PUT /api/business/hours`)
   - Monday to Sunday (dayOfWeek 0=Sun..6=Sat).
   - isOpen, openTime (local wall-clock time HH:mm), closeTime, breaks (`BusinessOperatingBreak`: startTime, endTime).
   - Validations: open < close, break inside hours, no overlapping breaks, closed days.

C. Booking Configuration Settings (`/dashboard/settings/booking`, `GET /api/business/booking-settings`, `PATCH /api/business/booking-settings`)
   - bookingEnabled, bookingIntervalMinutes, defaultBufferMinutes, minimumAdvanceMinutes, maximumAdvanceDays, cancellationWindowHours, autoConfirmBooking, allowCustomerReschedule.

D. Service Category Management (`/dashboard/services/categories`, `GET /api/service-categories`, `POST`, `GET /api/service-categories/[id]`, `PATCH`, `DELETE`)
   - Name, Slug (business-scoped unique), Description, Display Order, Is Active.
   - Safe deactivation preferred, cascade protection if referenced.

E. Grooming Service Management (`/dashboard/services`, `/dashboard/services/new`, `/dashboard/services/[id]/edit`, `GET /api/services`, `POST`, `GET /api/services/[id]`, `PATCH`, `DELETE`)
   - Name, Slug, CategoryId, Short Description, Full Description, Price (Prisma Decimal IDR), Duration (minutes), Buffer Minutes, Service Image (MinIO key/url), Display Order, Is Active.
   - IDOR prevention, soft deletion if historical bookings exist.

F. Business Gallery Management (`/dashboard/gallery`, `GET /api/gallery`, `POST`, `PATCH /api/gallery/[id]`, `DELETE /api/gallery/[id]`)
   - `BusinessGallery`: id, businessId, objectKey, caption, altText, displayOrder, isActive.
   - Persist images in MinIO, metadata in PostgreSQL.

G. MinIO Media Upload & Retrieval (`POST /api/media/upload`, `GET /api/media/[id]`, `DELETE /api/media/[id]`)
   - Storage categories: `business/logos/`, `services/images/`, `gallery/images/`.
   - Safe unique UUID names, max 5MB, format: JPEG/PNG/WebP (reject SVG, executables), verify file signature/magic bytes.
   - Public/authenticated retrieval via proxy or short-lived signed URLs.

H. Admin Dashboard Integration
   - Extend sidebar: Services (All Services, Categories), Gallery, Settings (Business Profile, Operating Hours, Booking Settings).
   - RBAC: OWNER (full access, business/booking settings), ADMIN (categories, services, gallery, view hours/settings).

I. Form Validation (React Hook Form + Zod, Sonner toast, loading states, error handling).
J. Testing & Documentation (Vitest unit/integration tests, docs/BUSINESS_MANAGEMENT.md, docs/SERVICE_MANAGEMENT.md, docs/MINIO_MEDIA.md, docs/PHASE_03_REPORT.md).
