/*
  Warnings:

  - You are about to drop the column `customerId` on the `reviews` table. All the data in the column will be lost.
  - Made the column `customerEmail` on table `reviews` required. This step will fail if there are existing NULL values in that column.
  - Made the column `customerName` on table `reviews` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_customerId_fkey";

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "customerId",
ALTER COLUMN "customerEmail" SET NOT NULL,
ALTER COLUMN "customerName" SET NOT NULL;
