-- CreateTable
CREATE TABLE "driver_photos" (
    "id" SERIAL NOT NULL,
    "driverAssignmentId" INTEGER NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "photoType" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "driver_photos" ADD CONSTRAINT "driver_photos_driverAssignmentId_fkey" FOREIGN KEY ("driverAssignmentId") REFERENCES "driver_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
