-- Add profile image fields for user profile photos stored in Cloudinary
ALTER TABLE "User"
ADD COLUMN "profileImage" TEXT,
ADD COLUMN "profileImagePublicId" TEXT;
