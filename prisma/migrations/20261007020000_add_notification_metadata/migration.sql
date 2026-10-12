ALTER TABLE "Notification"
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN "href" TEXT;

CREATE INDEX "Notification_userId_isRead_createdAt_idx"
ON "Notification"("userId", "isRead", "createdAt");