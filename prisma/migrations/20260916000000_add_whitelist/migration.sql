CREATE TABLE "Whitelist" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "projectName" "ProjectName" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Whitelist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Whitelist_phoneNumber_key" ON "Whitelist"("phoneNumber");