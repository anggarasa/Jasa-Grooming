# Feature Traceability Matrix & Evidence Registry
# TampilKit Booking — Basic Booking Template (PawCare Grooming)

**Versi:** 0.8.0  
**Tanggal Eksekusi:** 23 Oktober 2026  
**Status:** **100% VERIFIED & EVIDENCE-DRIVEN**

---

## 1. Matriks Keterlacakan Fitur (Phase 01 — Phase 07)

| ID | Modul / Fitur | Berkas Sumber Utama | API / Endpoint | Model Basis Data | Berkas Pengujian | Status Hasil |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TRC-01** | Fondasi App & Environment | `src/config/env.ts`, `src/lib/prisma.ts`, `src/lib/minio.ts` | `GET /api/health` | Seluruh skema (17 model) | `tests/unit/env.test.ts`, `tests/integration/health.test.ts` | **PASS** |
| **TRC-02** | Autentikasi Dual-JWT & RBAC | `src/modules/auth/*`, `src/lib/auth-guard.ts` | `POST /api/auth/login`, `/refresh`, `/logout` | `User`, `AuthSession`, `RefreshTokenRecord` | `tests/unit/auth.test.ts`, `tests/integration/auth.test.ts` | **PASS** |
| **TRC-03** | Profil Bisnis & Jam Operasional | `src/modules/business/*` | `GET/PATCH /api/business`, `/hours` | `BusinessProfile`, `BusinessOperatingHour`, `BusinessOperatingBreak` | `tests/unit/business.test.ts` | **PASS** |
| **TRC-04** | Katalog Layanan Decimal & Galeri | `src/modules/services/*`, `src/modules/gallery/*` | `GET/POST /api/services`, `/gallery` | `ServiceCategory`, `Service`, `BusinessGallery` | `tests/unit/services.test.ts`, `tests/unit/gallery.test.ts` | **PASS** |
| **TRC-05** | Website Publik Dinamis & SEO | `src/app/(public)/*`, `src/lib/seo.ts` | `/`, `/services`, `/gallery`, `/about`, `/contact`, `/sitemap.xml` | Data publik via RSC | `tests/unit/public-services.test.ts`, `tests/unit/seo.test.ts` | **PASS** |
| **TRC-06** | Booking Engine & Slot Generator | `src/modules/availability/*` | `GET /api/availability` | `BusinessOperatingHour`, `BusinessSetting`, `ResourceBlock` | `tests/unit/availability.test.ts` | **PASS** |
| **TRC-07** | Concurrency Lock & Anti-Double Booking | `src/modules/bookings/booking.service.ts` | `POST /api/bookings` | `Booking`, `BookingResource`, `BookingIdempotency` | `tests/integration/concurrency-deep.test.ts` | **PASS** |
| **TRC-08** | Guest Portal & Token Ter-hash | `src/modules/bookings/guest-booking.service.ts` | `GET /api/bookings/manage` | `BookingAccessToken` | `tests/unit/booking-engine.test.ts` | **PASS** |
| **TRC-09** | Admin Operations & Overview KPIs | `src/modules/bookings/admin-booking.service.ts` | `GET /api/admin/dashboard/overview`, `/bookings` | `Booking`, `BookingStatusHistory`, `BookingAuditLog` | `tests/unit/admin-booking.test.ts`, `tests/unit/admin-ui.test.tsx` | **PASS** |
| **TRC-10** | Walk-in Booking & Snapshots | `src/modules/bookings/admin-booking.service.ts` | `POST /api/admin/bookings`, `/bookings/walk-in` | `Booking`, `BookingResource` | `tests/integration/concurrency-deep.test.ts` | **PASS** |
| **TRC-11** | Reschedule & Cancellation Flow | `src/modules/bookings/reschedule.service.ts` | `POST /api/admin/bookings/[id]/reschedule`, `/cancel` | `BookingRescheduleHistory`, `BookingAuditLog` | `tests/integration/concurrency-deep.test.ts` | **PASS** |
| **TRC-12** | Direktori Pelanggan & Hewan | `src/modules/customers/customer.service.ts` | `GET /api/admin/customers`, `/[id]` | `Customer`, `Pet` | `tests/unit/admin-booking.test.ts` | **PASS** |
| **TRC-13** | Resource Time Blocking | `src/modules/bookings/resource-block.service.ts` | `GET/POST/DELETE /api/admin/resource-blocks` | `ResourceBlock` | `tests/integration/concurrency-deep.test.ts` | **PASS** |
| **TRC-14** | Google Calendar OAuth 2.0 PKCE | `src/modules/integrations/google/google-oauth.service.ts` | `GET /api/integrations/google/connect`, `/callback` | `CalendarConnection` | `tests/unit/google-calendar/google-oauth.test.ts` | **PASS** |
| **TRC-15** | Token Enkripsi AES-256-GCM | `src/lib/encryption.ts` | Server-only helper | `CalendarConnection` | `tests/unit/google-calendar/encryption.test.ts` | **PASS** |
| **TRC-16** | Outbox Queue & Worker Durable | `src/modules/integrations/google/google-sync-worker.service.ts` | `GET /api/integrations/google/sync-jobs`, `/retry` | `CalendarSyncJob`, `CalendarEventMapping` | `tests/unit/google-calendar/google-sync-worker.test.ts` | **PASS** |
| **TRC-17** | Google FreeBusy Fail-Closed | `src/modules/integrations/google/google-freebusy.service.ts` | `GET /api/availability` | `CalendarExternalBusyInterval` | `tests/unit/google-calendar/google-freebusy.test.ts` | **PASS** |
| **TRC-18** | Webhook & Incremental SyncToken | `src/modules/integrations/google/google-webhook.service.ts` | `POST /api/webhooks/google-calendar` | `CalendarWebhookChannel`, `CalendarSyncState` | `tests/unit/google-calendar/google-webhook.test.ts` | **PASS** |
| **TRC-19** | Conflict Resolution Side-by-Side | `src/modules/integrations/google/google-conflict.service.ts` | `GET/POST /api/integrations/google/conflicts` | `CalendarSyncConflict` | `tests/unit/google-calendar/google-conflict.test.ts` | **PASS** |
| **TRC-20** | Reusabilitas Template Rebranding | Data Configuration / Seed | N/A (Murni data) | `BusinessProfile`, `Service`, `ServiceCategory` | `tests/integration/template-rebranding.test.ts` | **PASS** |

---

## 2. Catatan Eksekusi & Bukti Pengujian

- **Total Test Suites**: 44 files
- **Total Tests Passing**: 340 tests (100% PASS)
- **TypeScript Strict Check**: 0 error
- **ESLint 9**: 0 error
- **Next.js Production Build**: 81/81 routes berhasil dikompilasi
- **Database Concurrency Scenarios**: 10 dari 10 skenario lulus tanpa ada double-booking aktif
