-- Add required proof image URL to leave requests (uploaded to Cloudinary).
ALTER TABLE "LeaveRequest" ADD COLUMN "proofImageUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "LeaveRequest" ALTER COLUMN "proofImageUrl" DROP DEFAULT;
