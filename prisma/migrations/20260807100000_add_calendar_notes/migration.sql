CREATE TABLE "CalendarNote" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "noteDate" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "done" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CalendarNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CalendarNote_userId_noteDate_idx"
  ON "CalendarNote"("userId", "noteDate");

ALTER TABLE "CalendarNote"
  ADD CONSTRAINT "CalendarNote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;