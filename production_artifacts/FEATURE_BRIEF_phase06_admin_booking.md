# FEATURE BRIEF: Phase 06 — Admin Booking Dashboard & Appointment Management

## 1. Project Context
- Project: TampilKit Booking (PawCare Grooming Template)
- Architecture: Next.js Fullstack Modular Monolith (App Router, React 19, TypeScript strict mode, Tailwind CSS v4, shadcn/ui)
- Database & ORM: PostgreSQL, Prisma ORM, versioned migrations.
- Auth: JWT Dual-token (jose), Argon2id, HttpOnly Cookies, RBAC (OWNER, ADMIN).
- Media: MinIO via Docker Desktop.
- Phase 05 Baseline: Availability Engine, PostgreSQL anti-double booking advisory lock, guest booking wizard, customer & pet persistence.

## 2. Core Objectives
Build the complete appointment management experience for business owners and administrators:
1. Real booking overview & KPI metrics on `/dashboard` (Today bookings, Upcoming, Confirmed, In Progress, Completed today, Cancelled today, Today appointments table, Quick actions).
2. Booking management table on `/dashboard/bookings` (Server-side pagination, search by code/customer/phone, status/date/service filters, sorting, actions).
3. Booking detail page on `/dashboard/bookings/[id]` (Booking info, Customer info, Pet info, Historical service snapshot, Internal notes, Status history, Reschedule history, Cancellation reason, Action triggers).
4. Interactive Appointment Calendar on `/dashboard/calendar` (Day, Week, Month views; business hours, booking blocks, blocked times, click to view detail or walk-in).
5. Booking Reschedule flow (Admin reschedule dialog, validates operating hours, breaks, service duration + buffer, prevents overlap with bookings/blocks, creates reschedule history, atomic transaction).
6. Booking Cancellation flow (Confirmation dialog, cancellation reason, records cancelledAt, status history, releases capacity).
7. Booking Status Management (State machine: PENDING -> CONFIRMED -> CHECKED_IN -> IN_PROGRESS -> COMPLETED; Terminal: COMPLETED, CANCELLED, NO_SHOW).
8. Walk-in Booking on `/dashboard/bookings/new` (Reuses Phase 05 Booking Engine, server-side price calculation, persistence, source=WALK_IN or ADMIN).
9. Customer & Pet Directory on `/dashboard/customers` and `/dashboard/customers/[id]` (Directory list, search, customer profile, associated pets, booking history).
10. Manual Time Blocking on `/dashboard/blocked-times` (ResourceBlock model, unified capacity enforcement preventing overlaps with bookings).
11. Booking Audit Logging (BookingAuditLog for tracking administrative actions).
12. RBAC enforcement (OWNER and ADMIN permissions on every endpoint and page).
13. Concurrency & Transactional Safety (PostgreSQL advisory lock or exclusion handling for walk-in, reschedule, cancel, resource block).
14. Unit, Integration, and Regression Tests.
15. Complete Documentation.
