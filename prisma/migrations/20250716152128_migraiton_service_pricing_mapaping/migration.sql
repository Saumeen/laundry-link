-- CreateTable
CREATE TABLE "service_pricing_mappings" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "pricingItemId" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pricing_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_pricing_mappings_serviceId_pricingItemId_key" ON "service_pricing_mappings"("serviceId", "pricingItemId");

-- AddForeignKey
ALTER TABLE "service_pricing_mappings" ADD CONSTRAINT "service_pricing_mappings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_pricing_mappings" ADD CONSTRAINT "service_pricing_mappings_pricingItemId_fkey" FOREIGN KEY ("pricingItemId") REFERENCES "pricing_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
