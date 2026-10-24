# TAMPILKIT STUDIO — BASIC BOOKING TEMPLATE
# PHASE 08 — FINAL QA, SECURITY, PERFORMANCE & PRODUCTION READINESS

## ROLE & EXECUTION MODE
You are a Principal Fullstack Engineer, QA Automation Engineer, Application Security Engineer, Database Reliability Engineer, and Release Manager.
You are responsible for finalizing the existing TampilKit Booking project.
**Your task is to perform a real, evidence-driven final quality review and implement the necessary fixes directly in the existing codebase.**
Do not stop at writing a testing plan or checklist.
This is the final development phase for the Basic Booking Template.
DO NOT automatically deploy to production.
DO NOT claim go-live without complete evidence and explicit authorization.

## 1. PROJECT CONTEXT & STACK
- Next.js 16 App Router, React 19, TypeScript strict mode
- PostgreSQL, Prisma ORM
- JWT Access Token & Refresh Token with rotation, Argon2id
- shadcn/ui, Tailwind CSS v4, Lucide React, React Hook Form, Zod
- MinIO S3 (Docker Desktop)
- Google Calendar API & OAuth 2.0 (googleapis, google-auth-library)
- PostgreSQL-backed durable background jobs (CalendarSyncJob)
- npm ONLY (no pnpm, yarn, bun)
- Bahasa Indonesia for all user-facing & admin-facing copy.

## 2. PHASE 01–07 VERIFICATION & IMPLEMENTATION TRACEABILITY
- Phase 01: Foundation, PostgreSQL, Prisma, MinIO, Health endpoint, Design system.
- Phase 02: Auth, Argon2id, Dual-JWT HttpOnly Cookies, Token rotation & reuse detection, RBAC, Sessions manager.
- Phase 03: Business profile, Operating hours 7d & breaks, Booking settings, Services & Categories CRUD, Gallery, MinIO upload.
- Phase 04: Public website, Services catalog, Detail, Gallery lightbox, About, Contact, WhatsApp links, SEO JSON-LD, Sitemap, Robots.
- Phase 05: Booking Engine, Slot availability generator, Buffer time, Anti-double booking PostgreSQL advisory locks, Idempotency, Confirmation, Guest manage access.
- Phase 06: Admin dashboard overview (6 real KPIs), Master bookings table, Detail snapshots & internal notes, Calendar day/week/month, Walk-in booking wizard, Customer directory, Resource blocking, Audit logging, State machine.
- Phase 07: Google Calendar OAuth 2.0 PKCE, Calendar selection, AES-256-GCM token encryption, Outbox queue & worker, Sync mutations, Google FreeBusy fail-closed, Push webhook, Incremental syncToken, Conflict resolution side-by-side, Safe disconnect.

## 3. CORE OBJECTIVES
1. Initial codebase audit & Feature Traceability Matrix (`docs/qa/evidence-registry.md`).
2. Full functional regression across critical user journeys (A through G).
3. Booking engine integrity & PostgreSQL concurrency testing (no active double booking under race conditions).
4. Application security review (OWASP ASVS 5.0 reference: Auth, Cookies, RBAC, IDOR, Web/XSS/CSRF/SQLi, MinIO file security, OAuth state & token encryption).
5. Google Calendar reliability & failure mode testing (outbox retry, FreeBusy fail-closed, webhook, 410 syncToken recovery).
6. Database migration integrity (clean DB test, seed idempotency, deployment safety).
7. Backup & restore validation runbooks (PostgreSQL pg_dump/restore, MinIO object backup/restore, encryption keys).
8. Performance & load testing (k6/Artillery/test runner, latency targets, contention scenarios).
9. Frontend quality & accessibility (responsive 320px–1440px, keyboard focus, color contrast, no console errors).
10. SEO & metadata validation.
11. Dependency audit & environment configuration review (`npm audit`, secret sanitization).
12. Observability & Health semantics (Liveness, Readiness, Degraded, structured logging).
13. CI validation pipeline workflow.
14. Deployment runbook (`docs/DEPLOYMENT_RUNBOOK.md`) & Rollback runbook (`docs/ROLLBACK_RUNBOOK.md`).
15. Operations handover guide (`docs/OPERATIONS_HANDOVER.md`).
16. Template reusability validation (Studio Barber rebranding proof test without core code modifications, documented in `docs/TEMPLATE_REUSABILITY.md`).
17. Final GO / NO-GO release gate (`docs/GO_NO_GO_REVIEW.md`).
18. Fix any identified defects cleanly with regression tests.
19. Final implementation report (`docs/PHASE_08_REPORT.md`).
