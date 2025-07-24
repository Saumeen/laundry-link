-- CreateTable
CREATE TABLE "time_slot_configs" (
    "id" SERIAL NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 3,
    "startTime" TEXT NOT NULL DEFAULT '09:00',
    "endTime" TEXT NOT NULL DEFAULT '21:00',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_slot_configs_pkey" PRIMARY KEY ("id")
);

-- Insert default time slot configuration
INSERT INTO "time_slot_configs" ("slotDuration", "startTime", "endTime", "isActive", "createdAt", "updatedAt") VALUES
(3, '09:00', '21:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add columns to orders table
ALTER TABLE "orders" ADD COLUMN "pickupStartTime" TIMESTAMP(3),
ADD COLUMN "pickupEndTime" TIMESTAMP(3),
ADD COLUMN "deliveryStartTime" TIMESTAMP(3),
ADD COLUMN "deliveryEndTime" TIMESTAMP(3);

-- Drop old columns if they exist
ALTER TABLE "orders" DROP COLUMN IF EXISTS "pickupTime";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "deliveryTime";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "pickupTimeSlotId";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "deliveryTimeSlotId"; 