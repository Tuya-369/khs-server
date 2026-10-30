CREATE TYPE "LeaveDurationType" AS ENUM ('DAILY', 'HOURLY');

ALTER TABLE "LeaveRequest"
ADD COLUMN "durationType" "LeaveDurationType" NOT NULL DEFAULT 'DAILY';
