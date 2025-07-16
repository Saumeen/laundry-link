-- CreateTable
CREATE TABLE "order_processing" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "processingStatus" TEXT NOT NULL,
    "totalPieces" INTEGER,
    "totalWeight" DOUBLE PRECISION,
    "processingNotes" TEXT,
    "qualityScore" INTEGER,
    "processingStartedAt" TIMESTAMP(3),
    "processingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_processing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processing_items" (
    "id" SERIAL NOT NULL,
    "orderProcessingId" INTEGER NOT NULL,
    "orderServiceMappingId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "processedQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_reports" (
    "id" SERIAL NOT NULL,
    "orderProcessingId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "issueType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resolution" TEXT,
    "photoUrl" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "issue_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_processing_orderId_key" ON "order_processing"("orderId");

-- AddForeignKey
ALTER TABLE "order_processing" ADD CONSTRAINT "order_processing_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_processing" ADD CONSTRAINT "order_processing_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_items" ADD CONSTRAINT "processing_items_orderProcessingId_fkey" FOREIGN KEY ("orderProcessingId") REFERENCES "order_processing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_items" ADD CONSTRAINT "processing_items_orderServiceMappingId_fkey" FOREIGN KEY ("orderServiceMappingId") REFERENCES "order_service_mappings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_orderProcessingId_fkey" FOREIGN KEY ("orderProcessingId") REFERENCES "order_processing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
