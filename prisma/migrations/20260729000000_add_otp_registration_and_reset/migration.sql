CREATE TYPE "OtpPurpose" AS ENUM ('REGISTRATION', 'PASSWORD_RESET');

ALTER TABLE "OtpVerification"
ADD COLUMN "purpose" "OtpPurpose" NOT NULL DEFAULT 'PASSWORD_RESET',
ADD COLUMN "usedAt" TIMESTAMP(3);

CREATE TABLE "PendingRegistration" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "sapId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "ProjectName" "ProjectName" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingRegistration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PendingRegistration_phoneNumber_key" ON "PendingRegistration"("phoneNumber");