-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "department" TEXT NOT NULL DEFAULT 'Unassigned',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'Unspecified';
