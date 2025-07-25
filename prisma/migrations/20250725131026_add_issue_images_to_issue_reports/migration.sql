/*
  Warnings:

  - You are about to drop the column `photoUrl` on the `issue_reports` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "issue_reports" DROP COLUMN "photoUrl",
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "processingItemDetailId" INTEGER;

-- AddForeignKey
ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_processingItemDetailId_fkey" FOREIGN KEY ("processingItemDetailId") REFERENCES "processing_item_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;
