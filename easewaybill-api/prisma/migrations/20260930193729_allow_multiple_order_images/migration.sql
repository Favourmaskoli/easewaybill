-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryMapboxId" TEXT,
ADD COLUMN     "pickupMapboxId" TEXT;

-- CreateTable
CREATE TABLE "order_images" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_images_orderId_idx" ON "order_images"("orderId");

-- AddForeignKey
ALTER TABLE "order_images" ADD CONSTRAINT "order_images_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
