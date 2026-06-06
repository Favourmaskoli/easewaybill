-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('CARD', 'BANK_TRANSFER', 'USSD', 'QR', 'MOBILE_MONEY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PaymentRecordStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'ABANDONED', 'REVERSED');

-- CreateTable
CREATE TABLE "payment_records" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "channel" "PaymentChannel" NOT NULL DEFAULT 'UNKNOWN',
    "status" "PaymentRecordStatus" NOT NULL DEFAULT 'PENDING',
    "authorizationUrl" TEXT,
    "accessCode" TEXT,
    "paystackId" TEXT,
    "initiatedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "paystackData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_records_reference_key" ON "payment_records"("reference");

-- CreateIndex
CREATE INDEX "payment_records_orderId_idx" ON "payment_records"("orderId");

-- CreateIndex
CREATE INDEX "payment_records_reference_idx" ON "payment_records"("reference");

-- CreateIndex
CREATE INDEX "payment_records_status_idx" ON "payment_records"("status");

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
