# TAMPILKIT STUDIO — BASIC BOOKING TEMPLATE
# PHASE 07 — GOOGLE CALENDAR OAUTH, FREEBUSY & BIDIRECTIONAL SYNCHRONIZATION

## ROLE & EXECUTION MODE

You are a Senior Fullstack Engineer, Software Architect, Integration Engineer, and Security Engineer.
You are continuing the existing TampilKit Booking project.
**Your task is to IMPLEMENT Phase 07 directly in the existing codebase.**

## 1. PROJECT CONTEXT
Project: TampilKit Booking (PawCare Grooming)
Architecture: Next.js Fullstack Modular Monolith (App Router, React 19, TypeScript strict, PostgreSQL, Prisma ORM, shadcn/ui, Tailwind CSS, Lucide React, Zod, MinIO S3, npm ONLY).
Integration: Google Calendar API v3, Google OAuth 2.0 (googleapis, google-auth-library).

## 2. MAIN OBJECTIVES
1. Google Cloud OAuth configuration & environment setup (googleapis, google-auth-library).
2. Secure Google account connection (OAuth2 with PKCE/state, OWNER only).
3. Calendar selection (/dashboard/settings/integrations).
4. Encrypted OAuth token storage (AES-256-GCM with environment encryption key).
5. Automatic token refresh & revocation handling.
6. Google Calendar connection status monitoring.
7. Booking-to-Google event creation (Summary: "Grooming — {Service Name} — {Booking Code}", start to occupancyEndAt).
8. Booking reschedule synchronization.
9. Booking cancellation synchronization (delete managed event).
10. Resource block synchronization (Phase 06 ResourceBlock).
11. Google FreeBusy availability engine integration (fail-closed policy if unable to verify).
12. Webhook receiver (/api/webhooks/google-calendar) with channel validation.
13. Incremental synchronization (syncToken cursor, HTTP 410 expired token recovery).
14. External calendar event tracking (CalendarExternalBusyInterval).
15. Conflict detection & structured conflict workflow (CalendarSyncConflict).
16. Sync retry, backoff, and reconciliation (PostgreSQL outbox queue & durable worker).
17. Admin sync monitoring dashboard (/dashboard/integrations/google-calendar).
18. Secure account disconnection workflow.
19. Automated unit, integration, and regression tests.
20. Complete documentation.

## 3. BASIC TEMPLATE LIMITATIONS
- Single business, single connected Google account, single selected calendar, single shared resource ("Main Grooming Station").
- Pay-at-location model.
- All customer-facing text in Bahasa Indonesia.

## 4. OAUTH & CREDENTIAL CONFIGURATION
- Scopes: narrowest calendar scopes (`https://www.googleapis.com/auth/calendar.events`, `https://www.googleapis.com/auth/calendar.readonly`, etc.).
- Offline access (`access_type=offline`, prompt `consent`).
- Local redirect: `http://localhost:3000/api/integrations/google/callback`.
- Env vars in .env.example:
  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
  - GOOGLE_OAUTH_STATE_SECRET, GOOGLE_TOKEN_ENCRYPTION_KEY
  - GOOGLE_CALENDAR_SYNC_ENABLED, GOOGLE_CALENDAR_WEBHOOK_URL, GOOGLE_CALENDAR_WEBHOOK_TOKEN
  - GOOGLE_CALENDAR_SYNC_INTERVAL_MINUTES, GOOGLE_CALENDAR_RETRY_MAX_ATTEMPTS, GOOGLE_CALENDAR_FREEBUSY_TIMEOUT_MS
- App must start safely even if Google Calendar credentials are not configured.

## 5. DATABASE MODELS (PRISMA)
- CalendarConnection (businessId, provider, googleAccountId, googleAccountEmail, calendarId, calendarName, calendarTimezone, encryptedAccessToken, encryptedRefreshToken, tokenExpiresAt, grantedScopes, status, lastSyncAt, lastErrorAt).
- CalendarEventMapping (calendarConnectionId, bookingId, resourceBlockId, externalEventId, externalEventEtag, syncStatus, lastSyncedAt, lastSyncError).
- CalendarSyncState (calendarConnectionId, nextSyncToken, lastFullSyncAt, lastIncrementalSyncAt, lastSuccessfulSyncAt, syncStatus, lastError).
- CalendarWebhookChannel (calendarConnectionId, channelId, resourceId, verificationTokenHash, expirationAt, status).
- CalendarExternalBusyInterval (calendarConnectionId, externalEventId, startAt, endAt, isBusy, lastObservedAt).
- CalendarSyncJob (outbox job queue: calendarConnectionId, bookingId, resourceBlockId, operationType, aggregateVersion, status, attemptCount, nextAttemptAt, lockedUntil, lastError).
- CalendarSyncConflict (calendarConnectionId, bookingId, resourceBlockId, externalEventId, conflictType, localSnapshot, remoteSnapshot, status, detectedAt, resolvedAt, resolvedByUserId, resolutionNotes).

## 6. WORKER & SCRIPTS
- Outbox-backed worker: `npm run calendar:worker`, `npm run calendar:sync`, `npm run calendar:reconcile`, `npm run calendar:renew-watches`.
- Durable processing without fire-and-forget in serverless request handlers.
