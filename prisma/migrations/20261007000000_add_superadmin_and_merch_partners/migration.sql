ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';

CREATE TABLE "MerchPartner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "logo" TEXT NOT NULL DEFAULT '',
    "logoPublicId" TEXT,
    "url" TEXT NOT NULL DEFAULT '',
    "ctaLabel" TEXT NOT NULL DEFAULT 'Дэлгэрэнгүй',
    "footerText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchPartner_pkey" PRIMARY KEY ("id")
);

INSERT INTO "MerchPartner" ("id", "title", "updatedAt")
VALUES ('we-are-miners', 'We Are Miners', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;