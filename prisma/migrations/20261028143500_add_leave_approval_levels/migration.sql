CREATE TYPE "LeaveApprovalLevel" AS ENUM (
    'SENIOR_SPECIALIST',
    'UNIT_MANAGER',
    'HR_DIRECTOR'
);

ALTER TABLE "LeaveRequestAccess"
ADD COLUMN "approvalLevel" "LeaveApprovalLevel",
ADD COLUMN "isResponsibleHr" BOOLEAN NOT NULL DEFAULT false;
