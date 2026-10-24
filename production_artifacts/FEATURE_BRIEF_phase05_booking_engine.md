# TAMPILKIT STUDIO — BASIC BOOKING TEMPLATE
# PHASE 05 — BOOKING ENGINE, AVAILABILITY & CUSTOMER RESERVATION

## 1. PROJECT CONTEXT & RULES
- Project: TampilKit Booking (PawCare Grooming)
- Technology: Next.js App Router, TypeScript strict, React 19, PostgreSQL, Prisma ORM, shadcn/ui, Tailwind CSS v4, Lucide React, Zod, React Hook Form, MinIO (Docker Desktop), JWT.
- Preserve Phase 01 through Phase 04 features (auth, dashboard, business settings, services catalog, public website).
- Do not proceed to Phase 06 automatically. No Google Calendar API in Phase 05 (reserved for Phase 07).
- User-facing text: Bahasa Indonesia.

## 2. MAIN OBJECTIVES
1. Availability Engine (`src/modules/availability/`):
   - Computes available slots per date based on operating hours, breaks, slot interval (default 30m), service duration, buffer time (default + service buffer), existing bookings, minimum advance (default 60m), and maximum window (default 30d).
   - Timezone aware (Asia/Jakarta), half-open intervals `[startAt, resourceEndAt)`.
   - Returns available slots via `GET /api/availability?serviceId=...&date=YYYY-MM-DD`.
2. Concurrency-Safe Booking & Non-Overlap:
   - Shared resource model: `BookingResource` (default seeded: "Main Grooming Station").
   - Database level overlap prevention: PostgreSQL exclusion constraint / advisory transaction locks / interval overlap check.
   - Simulation of concurrent bookings: exactly one succeeds, second gets `SLOT_UNAVAILABLE` (HTTP 409).
3. Data Models Extension (`prisma/schema.prisma`):
   - `BookingResource`: id, businessId, name, isActive, timestamps.
   - `Booking`: resourceId, startAt, serviceEndAt, occupancyEndAt, serviceNameSnapshot, serviceDurationSnapshot, servicePriceSnapshot, totalPrice (Decimal), customerNotes, internalNotes, status (CONFIRMED / PENDING), bookingCode, timestamps.
   - `Customer`: businessId, name, email (nullable), phone (normalized).
   - `Pet`: customerId, name, type, breed, age, notes.
   - `BookingStatusHistory`: bookingId, fromStatus, toStatus, reason, changedByUserId, createdAt.
   - `BookingAccessToken`: bookingId, tokenHash, expiresAt, revokedAt, createdAt.
   - `BookingIdempotency`: keyHash, requestFingerprint, bookingId, createdAt, expiresAt.
4. Booking Submission & Code Generation:
   - `POST /api/bookings`: Public guest booking endpoint.
   - Idempotency key protection, server-side price & duration calculation (no trusting client price).
   - Generates unique human-readable code: `GRM-YYYYMMDD-XXXX`.
   - Creates Customer, Pet, Booking, Snapshots, Status History, and guest access token atomically.
5. Public Booking Wizard UI:
   - `/booking`: Replaces Phase 04 placeholder. Multi-step wizard (Step 1: Choose Service, Step 2: Choose Date, Step 3: Choose Time Slot, Step 4: Customer Details, Step 5: Pet Details, Step 6: Review & Confirm).
   - `/booking/confirmation`: Confirmation screen showing booking code, service, customer, pet, date/time, price, pay-at-location, and secure management link.
   - `/booking/manage`: Secure guest booking management page using opaque hashed token.
6. Testing:
   - Unit tests for availability slot generator, buffer calculation, timezone handling.
   - Integration tests for booking creation, idempotency, guest access token, and PostgreSQL concurrency test simulating two simultaneous bookings for the same slot.
