-- CreateEnum
CREATE TYPE "TransferRecordStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REVERSED', 'ABANDONED');

-- CreateTable
CREATE TABLE "transfer_records" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "transferCode" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "TransferRecordStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "paystackData" JSONB,
    "failureReason" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_recipients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientCode" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "paystackData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transfer_records_reference_key" ON "transfer_records"("reference");

-- CreateIndex
CREATE INDEX "transfer_records_orderId_idx" ON "transfer_records"("orderId");

-- CreateIndex
CREATE INDEX "transfer_records_reference_idx" ON "transfer_records"("reference");

-- CreateIndex
CREATE INDEX "transfer_records_status_idx" ON "transfer_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_recipients_userId_key" ON "transfer_recipients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_recipients_recipientCode_key" ON "transfer_recipients"("recipientCode");

-- CreateIndex
CREATE INDEX "transfer_recipients_userId_idx" ON "transfer_recipients"("userId");

-- AddForeignKey
ALTER TABLE "transfer_records" ADD CONSTRAINT "transfer_records_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_records" ADD CONSTRAINT "transfer_records_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "transfer_recipients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_recipients" ADD CONSTRAINT "transfer_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
