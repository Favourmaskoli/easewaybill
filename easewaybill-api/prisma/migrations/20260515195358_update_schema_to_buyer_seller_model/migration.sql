/*
  Warnings:

  - The values [ORDER_ASSIGNED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING,ASSIGNED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [SENDER,RECEIVER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `value` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `assignedAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `receiverEmail` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `receiverName` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `receiverPhone` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `receiverAddress` on the `waybills` table. All the data in the column will be lost.
  - You are about to drop the column `receiverName` on the `waybills` table. All the data in the column will be lost.
  - You are about to drop the column `receiverPhone` on the `waybills` table. All the data in the column will be lost.
  - You are about to drop the column `senderAddress` on the `waybills` table. All the data in the column will be lost.
  - You are about to drop the column `senderName` on the `waybills` table. All the data in the column will be lost.
  - You are about to drop the column `senderPhone` on the `waybills` table. All the data in the column will be lost.
  - Added the required column `buyerEmail` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemPrice` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerId` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerAddress` to the `waybills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerName` to the `waybills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerPhone` to the `waybills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerAddress` to the `waybills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerName` to the `waybills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerPhone` to the `waybills` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_FOR_BUYER', 'RESOLVED_FOR_SELLER', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisputeReason" AS ENUM ('ITEM_NOT_RECEIVED', 'ITEM_DAMAGED', 'ITEM_NOT_AS_DESCRIBED', 'WRONG_ITEM_SENT', 'SELLER_NOT_SHIPPING', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('ORDER_CREATED', 'ORDER_SENT_TO_BUYER', 'ORDER_CONFIRMED_BUYER', 'ORDER_PAYMENT_PENDING', 'ORDER_PAID', 'ORDER_SHIPPED', 'ORDER_PICKED_UP', 'ORDER_IN_TRANSIT', 'ORDER_DELIVERED', 'ORDER_COMPLETED', 'ORDER_CANCELLED', 'ORDER_DISPUTED', 'ESCROW_FUNDED', 'ESCROW_RELEASED', 'ESCROW_REFUNDED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'WAYBILL_GENERATED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED', 'ACCOUNT_VERIFIED', 'GENERAL');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('DRAFT', 'PENDING_BUYER', 'AWAITING_PAYMENT', 'PAID', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'CANCELLED', 'REFUNDED');
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SELLER', 'BUYER', 'RIDER', 'ADMIN');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'SELLER';
COMMIT;

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_senderId_fkey";

-- DropIndex
DROP INDEX "orders_senderId_idx";

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "value",
ADD COLUMN     "unitPrice" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "amount",
DROP COLUMN "assignedAt",
DROP COLUMN "receiverEmail",
DROP COLUMN "receiverName",
DROP COLUMN "receiverPhone",
DROP COLUMN "senderId",
ADD COLUMN     "buyerConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "buyerEmail" TEXT NOT NULL,
ADD COLUMN     "buyerId" TEXT,
ADD COLUMN     "buyerName" TEXT,
ADD COLUMN     "buyerPhone" TEXT,
ADD COLUMN     "deliveryFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "itemPrice" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "sellerId" TEXT NOT NULL,
ADD COLUMN     "sellerPayout" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "sentToBuyerAt" TIMESTAMP(3),
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "totalAmount" DECIMAL(12,2) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankCode" TEXT,
ADD COLUMN     "businessName" TEXT,
ALTER COLUMN "role" SET DEFAULT 'SELLER';

-- AlterTable
ALTER TABLE "waybills" DROP COLUMN "receiverAddress",
DROP COLUMN "receiverName",
DROP COLUMN "receiverPhone",
DROP COLUMN "senderAddress",
DROP COLUMN "senderName",
DROP COLUMN "senderPhone",
ADD COLUMN     "buyerAddress" TEXT NOT NULL,
ADD COLUMN     "buyerName" TEXT NOT NULL,
ADD COLUMN     "buyerPhone" TEXT NOT NULL,
ADD COLUMN     "sellerAddress" TEXT NOT NULL,
ADD COLUMN     "sellerName" TEXT NOT NULL,
ADD COLUMN     "sellerPhone" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "raisedById" TEXT NOT NULL,
    "reason" "DisputeReason" NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolutionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "disputes_orderId_key" ON "disputes"("orderId");

-- CreateIndex
CREATE INDEX "disputes_orderId_idx" ON "disputes"("orderId");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "disputes_raisedById_idx" ON "disputes"("raisedById");

-- CreateIndex
CREATE INDEX "orders_sellerId_idx" ON "orders"("sellerId");

-- CreateIndex
CREATE INDEX "orders_buyerId_idx" ON "orders"("buyerId");

-- CreateIndex
CREATE INDEX "orders_buyerEmail_idx" ON "orders"("buyerEmail");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
