-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'CHECKED_IN';
ALTER TYPE "BookingStatus" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "booking_status_histories" ADD COLUMN     "actorUserId" TEXT;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "lastModifiedByUserId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'PUBLIC_GUEST';

-- CreateTable
CREATE TABLE "booking_reschedule_histories" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "previousStartAt" TIMESTAMP(3) NOT NULL,
    "previousEndAt" TIMESTAMP(3) NOT NULL,
    "newStartAt" TIMESTAMP(3) NOT NULL,
    "newEndAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_reschedule_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_blocks" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_audit_logs" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "beforeData" JSONB,
    "afterData" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_reschedule_histories_bookingId_createdAt_idx" ON "booking_reschedule_histories"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "resource_blocks_businessId_startAt_idx" ON "resource_blocks"("businessId", "startAt");

-- CreateIndex
CREATE INDEX "resource_blocks_resourceId_startAt_idx" ON "resource_blocks"("resourceId", "startAt");

-- CreateIndex
CREATE INDEX "resource_blocks_cancelledAt_idx" ON "resource_blocks"("cancelledAt");

-- CreateIndex
CREATE INDEX "booking_audit_logs_bookingId_createdAt_idx" ON "booking_audit_logs"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "booking_audit_logs_actorUserId_createdAt_idx" ON "booking_audit_logs"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "booking_audit_logs_action_createdAt_idx" ON "booking_audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "bookings_source_idx" ON "bookings"("source");

-- AddForeignKey
ALTER TABLE "booking_reschedule_histories" ADD CONSTRAINT "booking_reschedule_histories_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_blocks" ADD CONSTRAINT "resource_blocks_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_blocks" ADD CONSTRAINT "resource_blocks_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "booking_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_audit_logs" ADD CONSTRAINT "booking_audit_logs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
