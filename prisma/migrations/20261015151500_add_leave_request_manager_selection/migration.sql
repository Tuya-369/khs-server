ALTER TABLE "LeaveRequestAccess"
ADD COLUMN "displayName" TEXT NOT NULL DEFAULT '';

ALTER TABLE "LeaveRequestAccess"
ALTER COLUMN "canView" SET DEFAULT false;

ALTER TABLE "LeaveRequest"
ADD COLUMN "selectedApproverPhoneNumber" TEXT,
ADD COLUMN "selectedApproverName" TEXT;

CREATE INDEX "LeaveRequest_selectedApproverPhoneNumber_createdAt_idx"
ON "LeaveRequest"("selectedApproverPhoneNumber", "createdAt");

CREATE INDEX "LeaveRequestAccess_projectName_canApprove_idx"
ON "LeaveRequestAccess"("projectName", "canApprove");
