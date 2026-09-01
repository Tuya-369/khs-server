/*
  Warnings:

  - The values [APPROVED,REJECTED,CONFIRMED] on the enum `RequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RequestStatus_new" AS ENUM ('PENDING', 'SEARCHING', 'NOT_FOUND', 'COMPLETED');
ALTER TABLE "RepairRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "RepairRequest" ALTER COLUMN "status" TYPE "RequestStatus_new" USING ("status"::text::"RequestStatus_new");
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "RequestStatus_old";
ALTER TABLE "RepairRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'HR';
