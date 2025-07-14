/*
  Warnings:

  - You are about to drop the column `itemType` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `serviceType` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `invoice_items` table. All the data in the column will be lost.
  - You are about to drop the column `items` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `serviceType` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `orders` table. All the data in the column will be lost.
  - Added the required column `orderServiceMappingId` to the `invoice_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_orderId_fkey";

-- AlterTable
ALTER TABLE "invoice_items" DROP COLUMN "itemType",
DROP COLUMN "orderId",
DROP COLUMN "serviceType",
DROP COLUMN "totalPrice",
ADD COLUMN     "orderServiceMappingId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "items",
DROP COLUMN "serviceType",
DROP COLUMN "totalAmount";

-- CreateTable
CREATE TABLE "order_service_mappings" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_service_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_service_mappings_orderId_serviceId_key" ON "order_service_mappings"("orderId", "serviceId");

-- AddForeignKey
ALTER TABLE "order_service_mappings" ADD CONSTRAINT "order_service_mappings_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_service_mappings" ADD CONSTRAINT "order_service_mappings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_orderServiceMappingId_fkey" FOREIGN KEY ("orderServiceMappingId") REFERENCES "order_service_mappings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
