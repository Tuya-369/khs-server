ALTER TYPE "ProjectName" ADD VALUE 'OTHER';

CREATE TABLE "LeaveRequestAccess" (
    "phoneNumber" TEXT NOT NULL,
    "projectName" "ProjectName" NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequestAccess_pkey" PRIMARY KEY ("phoneNumber", "projectName")
);

CREATE INDEX "LeaveRequestAccess_projectName_canView_idx"
ON "LeaveRequestAccess"("projectName", "canView");

ALTER TABLE "LeaveRequestAccess"
ADD CONSTRAINT "LeaveRequestAccess_phoneNumber_fkey"
FOREIGN KEY ("phoneNumber") REFERENCES "Whitelist"("phoneNumber")
ON DELETE CASCADE ON UPDATE CASCADE;
