-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('BY_WEIGHT', 'BY_PIECE');

-- CreateEnum
CREATE TYPE "PricingUnit" AS ENUM ('KG', 'PIECE');

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pricingType" "PricingType" NOT NULL,
    "pricingUnit" "PricingUnit" NOT NULL,
    "icon" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");

-- Insert initial services data
INSERT INTO "services" ("name", "displayName", "description", "pricingType", "pricingUnit", "icon", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
('wash', 'Wash', 'Professional washing service', 'BY_WEIGHT', 'KG', '🧺', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('wash-iron', 'Wash & Iron', 'Washing and ironing service', 'BY_PIECE', 'PIECE', '👔', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dry-clean', 'Dry Clean', 'Professional dry cleaning', 'BY_PIECE', 'PIECE', '🧥', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('duvet-bulky', 'Duvet & Bulky Items', 'Large items cleaning', 'BY_PIECE', 'PIECE', '🛏️', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('carpet-cleaning', 'Carpet Cleaning', 'Professional carpet cleaning', 'BY_WEIGHT', 'KG', '🏠', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); 