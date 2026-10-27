-- AlterTable
ALTER TABLE "calendar_connections" DROP COLUMN "encryptedCredentials",
ADD COLUMN     "calendarName" TEXT,
ADD COLUMN     "calendarTimezone" TEXT,
ADD COLUMN     "encryptedAccessToken" TEXT,
ADD COLUMN     "encryptedRefreshToken" TEXT,
ADD COLUMN     "googleAccountEmail" TEXT,
ADD COLUMN     "googleAccountId" TEXT,
ADD COLUMN     "grantedScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "lastErrorAt" TIMESTAMP(3),
ADD COLUMN     "lastErrorMessage" TEXT,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3),
ALTER COLUMN "calendarId" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DISCONNECTED';

-- AlterTable
ALTER TABLE "calendar_event_mappings" ADD COLUMN     "externalEventEtag" TEXT,
ADD COLUMN     "lastSyncError" TEXT,
ADD COLUMN     "resourceBlockId" TEXT,
ALTER COLUMN "bookingId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "calendar_sync_states" (
    "id" TEXT NOT NULL,
    "calendarConnectionId" TEXT NOT NULL,
    "nextSyncToken" TEXT,
    "lastFullSyncAt" TIMESTAMP(3),
    "lastIncrementalSyncAt" TIMESTAMP(3),
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'IDLE',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_sync_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_webhook_channels" (
    "id" TEXT NOT NULL,
    "calendarConnectionId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "verificationTokenHash" TEXT NOT NULL,
    "expirationAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_webhook_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_external_busy_intervals" (
    "id" TEXT NOT NULL,
    "calendarConnectionId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isBusy" BOOLEAN NOT NULL DEFAULT true,
    "summary" TEXT,
    "lastObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_external_busy_intervals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_sync_jobs" (
    "id" TEXT NOT NULL,
    "calendarConnectionId" TEXT NOT NULL,
    "bookingId" TEXT,
    "resourceBlockId" TEXT,
    "operationType" TEXT NOT NULL,
    "payload" JSONB,
    "aggregateVersion" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_sync_conflicts" (
    "id" TEXT NOT NULL,
    "calendarConnectionId" TEXT NOT NULL,
    "bookingId" TEXT,
    "resourceBlockId" TEXT,
    "externalEventId" TEXT,
    "conflictType" TEXT NOT NULL,
    "localSnapshot" JSONB NOT NULL,
    "remoteSnapshot" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_sync_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_sync_states_calendarConnectionId_key" ON "calendar_sync_states"("calendarConnectionId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_webhook_channels_channelId_key" ON "calendar_webhook_channels"("channelId");

-- CreateIndex
CREATE INDEX "calendar_webhook_channels_calendarConnectionId_status_idx" ON "calendar_webhook_channels"("calendarConnectionId", "status");

-- CreateIndex
CREATE INDEX "calendar_webhook_channels_expirationAt_idx" ON "calendar_webhook_channels"("expirationAt");

-- CreateIndex
CREATE INDEX "calendar_external_busy_intervals_calendarConnectionId_start_idx" ON "calendar_external_busy_intervals"("calendarConnectionId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "calendar_external_busy_intervals_startAt_endAt_idx" ON "calendar_external_busy_intervals"("startAt", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_external_busy_intervals_calendarConnectionId_exter_key" ON "calendar_external_busy_intervals"("calendarConnectionId", "externalEventId");

-- CreateIndex
CREATE INDEX "calendar_sync_jobs_status_nextAttemptAt_lockedUntil_idx" ON "calendar_sync_jobs"("status", "nextAttemptAt", "lockedUntil");

-- CreateIndex
CREATE INDEX "calendar_sync_jobs_calendarConnectionId_status_idx" ON "calendar_sync_jobs"("calendarConnectionId", "status");

-- CreateIndex
CREATE INDEX "calendar_sync_jobs_bookingId_idx" ON "calendar_sync_jobs"("bookingId");

-- CreateIndex
CREATE INDEX "calendar_sync_jobs_resourceBlockId_idx" ON "calendar_sync_jobs"("resourceBlockId");

-- CreateIndex
CREATE INDEX "calendar_sync_conflicts_calendarConnectionId_status_idx" ON "calendar_sync_conflicts"("calendarConnectionId", "status");

-- CreateIndex
CREATE INDEX "calendar_sync_conflicts_bookingId_idx" ON "calendar_sync_conflicts"("bookingId");

-- CreateIndex
CREATE INDEX "calendar_sync_conflicts_detectedAt_idx" ON "calendar_sync_conflicts"("detectedAt");

-- CreateIndex
CREATE INDEX "calendar_connections_businessId_status_idx" ON "calendar_connections"("businessId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_connections_businessId_provider_key" ON "calendar_connections"("businessId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_event_mappings_resourceBlockId_key" ON "calendar_event_mappings"("resourceBlockId");

-- CreateIndex
CREATE INDEX "calendar_event_mappings_calendarConnectionId_syncStatus_idx" ON "calendar_event_mappings"("calendarConnectionId", "syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_event_mappings_calendarConnectionId_externalEventI_key" ON "calendar_event_mappings"("calendarConnectionId", "externalEventId");

-- AddForeignKey
ALTER TABLE "calendar_event_mappings" ADD CONSTRAINT "calendar_event_mappings_resourceBlockId_fkey" FOREIGN KEY ("resourceBlockId") REFERENCES "resource_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_states" ADD CONSTRAINT "calendar_sync_states_calendarConnectionId_fkey" FOREIGN KEY ("calendarConnectionId") REFERENCES "calendar_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_webhook_channels" ADD CONSTRAINT "calendar_webhook_channels_calendarConnectionId_fkey" FOREIGN KEY ("calendarConnectionId") REFERENCES "calendar_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_external_busy_intervals" ADD CONSTRAINT "calendar_external_busy_intervals_calendarConnectionId_fkey" FOREIGN KEY ("calendarConnectionId") REFERENCES "calendar_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_jobs" ADD CONSTRAINT "calendar_sync_jobs_calendarConnectionId_fkey" FOREIGN KEY ("calendarConnectionId") REFERENCES "calendar_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_jobs" ADD CONSTRAINT "calendar_sync_jobs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_jobs" ADD CONSTRAINT "calendar_sync_jobs_resourceBlockId_fkey" FOREIGN KEY ("resourceBlockId") REFERENCES "resource_blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_conflicts" ADD CONSTRAINT "calendar_sync_conflicts_calendarConnectionId_fkey" FOREIGN KEY ("calendarConnectionId") REFERENCES "calendar_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_conflicts" ADD CONSTRAINT "calendar_sync_conflicts_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_conflicts" ADD CONSTRAINT "calendar_sync_conflicts_resourceBlockId_fkey" FOREIGN KEY ("resourceBlockId") REFERENCES "resource_blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_conflicts" ADD CONSTRAINT "calendar_sync_conflicts_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

