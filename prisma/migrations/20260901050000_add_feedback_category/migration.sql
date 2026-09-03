CREATE TYPE "FeedbackCategory" AS ENUM (
  'WORKPLACE',
  'OPERATIONS',
  'MANAGEMENT',
  'COMPENSATION',
  'OTHER'
);

ALTER TABLE "Feedback"
  ADD COLUMN "category" "FeedbackCategory" NOT NULL DEFAULT 'OTHER';

CREATE INDEX "Feedback_category_createdAt_idx"
  ON "Feedback"("category", "createdAt");