/*
  Warnings:

  - The values [SELLER,BUYER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isActive` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('USER', 'RIDER', 'ADMIN');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- DropIndex
DROP INDEX "users_isActive_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isActive",
ADD COLUMN     "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "role" SET DEFAULT 'USER';
