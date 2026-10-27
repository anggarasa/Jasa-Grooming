-- AlterTable
ALTER TABLE "business_settings" ADD COLUMN     "allowCustomerReschedule" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoConfirmBooking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cancellationWindowHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "maximumAdvanceDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "minimumAdvanceMinutes" INTEGER NOT NULL DEFAULT 60;

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "city" TEXT,
ADD COLUMN     "fullAddress" TEXT,
ADD COLUMN     "googleMapsUrl" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "whatsapp" TEXT;

-- AlterTable
ALTER TABLE "service_categories" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "bufferMinutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fullDescription" TEXT,
ADD COLUMN     "shortDescription" TEXT;

-- CreateTable
CREATE TABLE "business_operating_hours" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "openTime" TEXT NOT NULL DEFAULT '09:00',
    "closeTime" TEXT NOT NULL DEFAULT '18:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_operating_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_operating_breaks" (
    "id" TEXT NOT NULL,
    "operatingHourId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_operating_breaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_galleries" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "caption" TEXT,
    "altText" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "folder" TEXT NOT NULL DEFAULT 'uploads',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_operating_hours_businessId_dayOfWeek_idx" ON "business_operating_hours"("businessId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "business_operating_hours_businessId_dayOfWeek_key" ON "business_operating_hours"("businessId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "business_operating_breaks_operatingHourId_idx" ON "business_operating_breaks"("operatingHourId");

-- CreateIndex
CREATE INDEX "business_galleries_businessId_displayOrder_idx" ON "business_galleries"("businessId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_objectKey_key" ON "media_assets"("objectKey");

-- CreateIndex
CREATE INDEX "media_assets_businessId_folder_idx" ON "media_assets"("businessId", "folder");

-- CreateIndex
CREATE INDEX "service_categories_businessId_displayOrder_idx" ON "service_categories"("businessId", "displayOrder");

-- CreateIndex
CREATE INDEX "services_businessId_displayOrder_idx" ON "services"("businessId", "displayOrder");

-- AddForeignKey
ALTER TABLE "business_operating_hours" ADD CONSTRAINT "business_operating_hours_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_operating_breaks" ADD CONSTRAINT "business_operating_breaks_operatingHourId_fkey" FOREIGN KEY ("operatingHourId") REFERENCES "business_operating_hours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_galleries" ADD CONSTRAINT "business_galleries_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
