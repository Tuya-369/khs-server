-- CreateEnum
CREATE TYPE "LeaveRequestStage" AS ENUM ('FIRST_APPROVER_REVIEW', 'SECOND_APPROVER_REVIEW', 'HR_REVIEW', 'FINAL_APPROVER_REVIEW');

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN "stageSequence" "LeaveRequestStage"[] DEFAULT ARRAY[]::"LeaveRequestStage"[],
ADD COLUMN "currentStage" "LeaveRequestStage",
ADD COLUMN "managerPhoneNumber" TEXT,
ADD COLUMN "managerName" TEXT,
ADD COLUMN "finalApproverPhoneNumber" TEXT,
ADD COLUMN "finalApproverName" TEXT;
