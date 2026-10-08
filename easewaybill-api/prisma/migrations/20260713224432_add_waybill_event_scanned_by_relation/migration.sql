-- AddForeignKey
ALTER TABLE "waybill_events" ADD CONSTRAINT "waybill_events_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
