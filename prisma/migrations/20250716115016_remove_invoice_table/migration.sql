/*
  Warnings:

  - You are about to drop the `invoice_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_orderServiceMappingId_fkey";

-- DropTable
DROP TABLE "invoice_items";
