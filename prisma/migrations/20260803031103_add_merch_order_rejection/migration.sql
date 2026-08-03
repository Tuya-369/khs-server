/*
  Warnings:

  - The values [CANCELLED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('NEW', 'CONFIRMED', 'REJECTED');
ALTER TABLE "MerchOrder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "MerchOrder" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "MerchOrder" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterTable
ALTER TABLE "MerchOrder" ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedById" TEXT;

-- AlterTable
ALTER TABLE "OtpVerification" ALTER COLUMN "purpose" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "MerchOrder" ADD CONSTRAINT "MerchOrder_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
