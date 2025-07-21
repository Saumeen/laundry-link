/*
  Warnings:

  - The `status` column on the `driver_assignments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `issue_reports` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `processingStatus` column on the `order_processing` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `status` on the `order_updates` table. All the data in the column will be lost.
  - The `status` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `paymentStatus` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `processing_item_details` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `processing_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `phone_verifications` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `newStatus` to the `order_updates` table without a default value. This is not possible if the table is not empty.

*/

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('ORDER_PLACED', 'CONFIRMED', 'PICKUP_ASSIGNED', 'PICKUP_IN_PROGRESS', 'PICKUP_COMPLETED', 'PICKUP_FAILED', 'RECEIVED_AT_FACILITY', 'PROCESSING_STARTED', 'PROCESSING_COMPLETED', 'QUALITY_CHECK', 'READY_FOR_DELIVERY', 'DELIVERY_ASSIGNED', 'DELIVERY_IN_PROGRESS', 'DELIVERED', 'DELIVERY_FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIAL_REFUND');

-- CreateEnum
CREATE TYPE "DriverAssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'QUALITY_CHECK', 'READY_FOR_DELIVERY', 'ISSUE_REPORTED');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ISSUE_REPORTED');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('REPORTED', 'INVESTIGATING', 'RESOLVED', 'ESCALATED');

-- DropForeignKey
ALTER TABLE "phone_verifications" DROP CONSTRAINT "phone_verifications_customerId_fkey";

-- Handle order_updates table conversion
ALTER TABLE "order_updates" ADD COLUMN "newStatus" "OrderStatus";
ALTER TABLE "order_updates" ADD COLUMN "oldStatus" "OrderStatus";

-- Convert existing status data to new enum format
UPDATE "order_updates" SET "newStatus" = 
  CASE 
    WHEN "status" = 'Order Placed' THEN 'ORDER_PLACED'::"OrderStatus"
    WHEN "status" = 'Confirmed' THEN 'CONFIRMED'::"OrderStatus"
    WHEN "status" = 'Pickup Assigned' THEN 'PICKUP_ASSIGNED'::"OrderStatus"
    WHEN "status" = 'Pickup In Progress' THEN 'PICKUP_IN_PROGRESS'::"OrderStatus"
    WHEN "status" = 'Pickup Completed' THEN 'PICKUP_COMPLETED'::"OrderStatus"
    WHEN "status" = 'Pickup Failed' THEN 'PICKUP_FAILED'::"OrderStatus"
    WHEN "status" = 'Received At Facility' THEN 'RECEIVED_AT_FACILITY'::"OrderStatus"
    WHEN "status" = 'Processing Started' THEN 'PROCESSING_STARTED'::"OrderStatus"
    WHEN "status" = 'Processing Completed' THEN 'PROCESSING_COMPLETED'::"OrderStatus"
    WHEN "status" = 'Quality Check' THEN 'QUALITY_CHECK'::"OrderStatus"
    WHEN "status" = 'Ready For Delivery' THEN 'READY_FOR_DELIVERY'::"OrderStatus"
    WHEN "status" = 'Delivery Assigned' THEN 'DELIVERY_ASSIGNED'::"OrderStatus"
    WHEN "status" = 'Delivery In Progress' THEN 'DELIVERY_IN_PROGRESS'::"OrderStatus"
    WHEN "status" = 'Delivered' THEN 'DELIVERED'::"OrderStatus"
    WHEN "status" = 'Delivery Failed' THEN 'DELIVERY_FAILED'::"OrderStatus"
    WHEN "status" = 'Cancelled' THEN 'CANCELLED'::"OrderStatus"
    WHEN "status" = 'Refunded' THEN 'REFUNDED'::"OrderStatus"
    ELSE 'ORDER_PLACED'::"OrderStatus"
  END;

-- Make newStatus NOT NULL after data conversion
ALTER TABLE "order_updates" ALTER COLUMN "newStatus" SET NOT NULL;

-- Drop the old status column
ALTER TABLE "order_updates" DROP COLUMN "status";

-- Handle orders table conversion
ALTER TABLE "orders" ADD COLUMN "status_new" "OrderStatus";
ALTER TABLE "orders" ADD COLUMN "paymentStatus_new" "PaymentStatus";

-- Convert existing order status data
UPDATE "orders" SET "status_new" = 
  CASE 
    WHEN "status" = 'Order Placed' THEN 'ORDER_PLACED'::"OrderStatus"
    WHEN "status" = 'Confirmed' THEN 'CONFIRMED'::"OrderStatus"
    WHEN "status" = 'Pickup Assigned' THEN 'PICKUP_ASSIGNED'::"OrderStatus"
    WHEN "status" = 'Pickup In Progress' THEN 'PICKUP_IN_PROGRESS'::"OrderStatus"
    WHEN "status" = 'Pickup Completed' THEN 'PICKUP_COMPLETED'::"OrderStatus"
    WHEN "status" = 'Pickup Failed' THEN 'PICKUP_FAILED'::"OrderStatus"
    WHEN "status" = 'Received At Facility' THEN 'RECEIVED_AT_FACILITY'::"OrderStatus"
    WHEN "status" = 'Processing Started' THEN 'PROCESSING_STARTED'::"OrderStatus"
    WHEN "status" = 'Processing Completed' THEN 'PROCESSING_COMPLETED'::"OrderStatus"
    WHEN "status" = 'Quality Check' THEN 'QUALITY_CHECK'::"OrderStatus"
    WHEN "status" = 'Ready For Delivery' THEN 'READY_FOR_DELIVERY'::"OrderStatus"
    WHEN "status" = 'Delivery Assigned' THEN 'DELIVERY_ASSIGNED'::"OrderStatus"
    WHEN "status" = 'Delivery In Progress' THEN 'DELIVERY_IN_PROGRESS'::"OrderStatus"
    WHEN "status" = 'Delivered' THEN 'DELIVERED'::"OrderStatus"
    WHEN "status" = 'Delivery Failed' THEN 'DELIVERY_FAILED'::"OrderStatus"
    WHEN "status" = 'Cancelled' THEN 'CANCELLED'::"OrderStatus"
    WHEN "status" = 'Refunded' THEN 'REFUNDED'::"OrderStatus"
    ELSE 'ORDER_PLACED'::"OrderStatus"
  END;

-- Convert existing payment status data
UPDATE "orders" SET "paymentStatus_new" = 
  CASE 
    WHEN "paymentStatus" = 'Pending' THEN 'PENDING'::"PaymentStatus"
    WHEN "paymentStatus" = 'Paid' THEN 'PAID'::"PaymentStatus"
    WHEN "paymentStatus" = 'Failed' THEN 'FAILED'::"PaymentStatus"
    WHEN "paymentStatus" = 'Refunded' THEN 'REFUNDED'::"PaymentStatus"
    WHEN "paymentStatus" = 'Partial Refund' THEN 'PARTIAL_REFUND'::"PaymentStatus"
    ELSE 'PENDING'::"PaymentStatus"
  END;

-- Drop old columns and rename new ones
ALTER TABLE "orders" DROP COLUMN "status";
ALTER TABLE "orders" DROP COLUMN "paymentStatus";
ALTER TABLE "orders" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "orders" RENAME COLUMN "paymentStatus_new" TO "paymentStatus";

-- Set default values
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'ORDER_PLACED';
ALTER TABLE "orders" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';

-- Handle driver_assignments table conversion
ALTER TABLE "driver_assignments" ADD COLUMN "status_new" "DriverAssignmentStatus";

UPDATE "driver_assignments" SET "status_new" = 
  CASE 
    WHEN "status" = 'assigned' THEN 'ASSIGNED'::"DriverAssignmentStatus"
    WHEN "status" = 'in_progress' THEN 'IN_PROGRESS'::"DriverAssignmentStatus"
    WHEN "status" = 'completed' THEN 'COMPLETED'::"DriverAssignmentStatus"
    WHEN "status" = 'cancelled' THEN 'CANCELLED'::"DriverAssignmentStatus"
    WHEN "status" = 'rescheduled' THEN 'RESCHEDULED'::"DriverAssignmentStatus"
    WHEN "status" = 'failed' THEN 'FAILED'::"DriverAssignmentStatus"
    ELSE 'ASSIGNED'::"DriverAssignmentStatus"
  END;

ALTER TABLE "driver_assignments" DROP COLUMN "status";
ALTER TABLE "driver_assignments" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "driver_assignments" ALTER COLUMN "status" SET DEFAULT 'ASSIGNED';

-- Handle order_processing table conversion
ALTER TABLE "order_processing" ADD COLUMN "processingStatus_new" "ProcessingStatus";

UPDATE "order_processing" SET "processingStatus_new" = 
  CASE 
    WHEN "processingStatus" = 'pending' THEN 'PENDING'::"ProcessingStatus"
    WHEN "processingStatus" = 'in_progress' THEN 'IN_PROGRESS'::"ProcessingStatus"
    WHEN "processingStatus" = 'completed' THEN 'COMPLETED'::"ProcessingStatus"
    WHEN "processingStatus" = 'quality_check' THEN 'QUALITY_CHECK'::"ProcessingStatus"
    WHEN "processingStatus" = 'ready_for_delivery' THEN 'READY_FOR_DELIVERY'::"ProcessingStatus"
    WHEN "processingStatus" = 'issue_reported' THEN 'ISSUE_REPORTED'::"ProcessingStatus"
    ELSE 'PENDING'::"ProcessingStatus"
  END;

ALTER TABLE "order_processing" DROP COLUMN "processingStatus";
ALTER TABLE "order_processing" RENAME COLUMN "processingStatus_new" TO "processingStatus";
ALTER TABLE "order_processing" ALTER COLUMN "processingStatus" SET DEFAULT 'PENDING';

-- Handle processing_items table conversion
ALTER TABLE "processing_items" ADD COLUMN "status_new" "ItemStatus";

UPDATE "processing_items" SET "status_new" = 
  CASE 
    WHEN "status" = 'pending' THEN 'PENDING'::"ItemStatus"
    WHEN "status" = 'in_progress' THEN 'IN_PROGRESS'::"ItemStatus"
    WHEN "status" = 'completed' THEN 'COMPLETED'::"ItemStatus"
    WHEN "status" = 'issue_reported' THEN 'ISSUE_REPORTED'::"ItemStatus"
    ELSE 'PENDING'::"ItemStatus"
  END;

ALTER TABLE "processing_items" DROP COLUMN "status";
ALTER TABLE "processing_items" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "processing_items" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Handle processing_item_details table conversion
ALTER TABLE "processing_item_details" ADD COLUMN "status_new" "ItemStatus";

UPDATE "processing_item_details" SET "status_new" = 
  CASE 
    WHEN "status" = 'pending' THEN 'PENDING'::"ItemStatus"
    WHEN "status" = 'in_progress' THEN 'IN_PROGRESS'::"ItemStatus"
    WHEN "status" = 'completed' THEN 'COMPLETED'::"ItemStatus"
    WHEN "status" = 'issue_reported' THEN 'ISSUE_REPORTED'::"ItemStatus"
    ELSE 'PENDING'::"ItemStatus"
  END;

ALTER TABLE "processing_item_details" DROP COLUMN "status";
ALTER TABLE "processing_item_details" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "processing_item_details" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Handle issue_reports table conversion
ALTER TABLE "issue_reports" ADD COLUMN "status_new" "IssueStatus";

UPDATE "issue_reports" SET "status_new" = 
  CASE 
    WHEN "status" = 'reported' THEN 'REPORTED'::"IssueStatus"
    WHEN "status" = 'investigating' THEN 'INVESTIGATING'::"IssueStatus"
    WHEN "status" = 'resolved' THEN 'RESOLVED'::"IssueStatus"
    WHEN "status" = 'escalated' THEN 'ESCALATED'::"IssueStatus"
    ELSE 'REPORTED'::"IssueStatus"
  END;

ALTER TABLE "issue_reports" DROP COLUMN "status";
ALTER TABLE "issue_reports" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "issue_reports" ALTER COLUMN "status" SET DEFAULT 'REPORTED';

-- DropTable
DROP TABLE "phone_verifications";

-- CreateTable
CREATE TABLE "order_history" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "staffId" INTEGER,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "order_history" ADD CONSTRAINT "order_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_history" ADD CONSTRAINT "order_history_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
