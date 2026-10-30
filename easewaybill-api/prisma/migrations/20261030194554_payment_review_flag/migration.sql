-- AlterTable
ALTER TABLE "payment_records" ADD COLUMN     "needsReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewNote" TEXT;

-- CreateIndex
CREATE INDEX "payment_records_status_createdAt_idx" ON "payment_records"("status", "createdAt");
