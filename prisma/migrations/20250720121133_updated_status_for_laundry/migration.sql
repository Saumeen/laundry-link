/*
  Warnings:

  - Made the column `status` on table `driver_assignments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `issue_reports` required. This step will fail if there are existing NULL values in that column.
  - Made the column `processingStatus` on table `order_processing` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `paymentStatus` on table `orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `processing_item_details` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `processing_items` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "driver_assignments" ALTER COLUMN "status" SET NOT NULL;

-- AlterTable
ALTER TABLE "issue_reports" ALTER COLUMN "status" SET NOT NULL;

-- AlterTable
ALTER TABLE "order_processing" ALTER COLUMN "processingStatus" SET NOT NULL;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "paymentStatus" SET NOT NULL;

-- AlterTable
ALTER TABLE "processing_item_details" ALTER COLUMN "status" SET NOT NULL;

-- AlterTable
ALTER TABLE "processing_items" ALTER COLUMN "status" SET NOT NULL;
