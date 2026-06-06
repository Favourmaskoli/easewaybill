-- CreateTable
CREATE TABLE "escrow_audit_logs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escrow_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "escrow_audit_logs_orderId_idx" ON "escrow_audit_logs"("orderId");

-- CreateIndex
CREATE INDEX "escrow_audit_logs_actorId_idx" ON "escrow_audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "escrow_audit_logs_action_idx" ON "escrow_audit_logs"("action");

-- CreateIndex
CREATE INDEX "escrow_audit_logs_createdAt_idx" ON "escrow_audit_logs"("createdAt");
