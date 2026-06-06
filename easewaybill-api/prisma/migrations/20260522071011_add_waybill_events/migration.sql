-- CreateTable
CREATE TABLE "waybill_events" (
    "id" TEXT NOT NULL,
    "waybillId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "location" TEXT,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "scannedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waybill_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "waybill_events_waybillId_idx" ON "waybill_events"("waybillId");

-- CreateIndex
CREATE INDEX "waybill_events_createdAt_idx" ON "waybill_events"("createdAt");

-- AddForeignKey
ALTER TABLE "waybill_events" ADD CONSTRAINT "waybill_events_waybillId_fkey" FOREIGN KEY ("waybillId") REFERENCES "waybills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
