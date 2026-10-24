/*
  Warnings:

  - Added the required column `occupancyEndAt` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resourceId` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceDurationSnapshot` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceEndAt` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceNameSnapshot` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `servicePriceSnapshot` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "bookings_status_idx";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "customerNotes" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "occupancyEndAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "resourceId" TEXT NOT NULL,
ADD COLUMN     "serviceDurationSnapshot" INTEGER NOT NULL,
ADD COLUMN     "serviceEndAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "serviceNameSnapshot" TEXT NOT NULL,
ADD COLUMN     "servicePriceSnapshot" DECIMAL(12,2) NOT NULL;

-- CreateTable
CREATE TABLE "booking_resources" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_status_histories" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus" NOT NULL,
    "reason" TEXT,
    "changedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_access_tokens" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_idempotencies" (
    "id" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "bookingId" TEXT,
    "responsePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_idempotencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_resources_businessId_isActive_idx" ON "booking_resources"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "booking_status_histories_bookingId_createdAt_idx" ON "booking_status_histories"("bookingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "booking_access_tokens_tokenHash_key" ON "booking_access_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "booking_access_tokens_bookingId_idx" ON "booking_access_tokens"("bookingId");

-- CreateIndex
CREATE INDEX "booking_access_tokens_tokenHash_idx" ON "booking_access_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "booking_idempotencies_keyHash_key" ON "booking_idempotencies"("keyHash");

-- CreateIndex
CREATE INDEX "booking_idempotencies_expiresAt_idx" ON "booking_idempotencies"("expiresAt");

-- CreateIndex
CREATE INDEX "bookings_bookingCode_idx" ON "bookings"("bookingCode");

-- CreateIndex
CREATE INDEX "bookings_resourceId_startAt_idx" ON "bookings"("resourceId", "startAt");

-- CreateIndex
CREATE INDEX "bookings_status_startAt_idx" ON "bookings"("status", "startAt");

-- CreateIndex
CREATE INDEX "bookings_occupancyEndAt_idx" ON "bookings"("occupancyEndAt");

-- CreateIndex
CREATE INDEX "pets_customerId_idx" ON "pets"("customerId");

-- AddForeignKey
ALTER TABLE "booking_resources" ADD CONSTRAINT "booking_resources_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "booking_resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_histories" ADD CONSTRAINT "booking_status_histories_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_access_tokens" ADD CONSTRAINT "booking_access_tokens_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_idempotencies" ADD CONSTRAINT "booking_idempotencies_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
