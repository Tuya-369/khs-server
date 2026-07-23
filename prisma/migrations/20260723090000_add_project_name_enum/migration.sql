-- CreateEnum
CREATE TYPE "ProjectName" AS ENUM ('UG', 'UB', 'Баяжуулах', 'Төсөл', 'operation', 'contraction');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "ProjectName" "ProjectName" NOT NULL DEFAULT 'UG';
