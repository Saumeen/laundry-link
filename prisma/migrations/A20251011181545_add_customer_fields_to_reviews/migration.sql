-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ALTER COLUMN "customerId" DROP NOT NULL;
