/*
  Warnings:

  - Made the column `pickupStartTime` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pickupEndTime` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `deliveryStartTime` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `deliveryEndTime` on table `orders` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'DROPPED_OFF';

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "pickupStartTime" SET NOT NULL,
ALTER COLUMN "pickupEndTime" SET NOT NULL,
ALTER COLUMN "deliveryStartTime" SET NOT NULL,
ALTER COLUMN "deliveryEndTime" SET NOT NULL;
