-- DropIndex
DROP INDEX "GraffitiSubmission_approved_idx";

-- DropIndex
DROP INDEX "QuoteSubmission_approved_is_featured_idx";

-- CreateIndex
CREATE INDEX "GraffitiSubmission_approved_display_until_idx" ON "GraffitiSubmission"("approved", "display_until");

-- CreateIndex
CREATE INDEX "QuoteSubmission_approved_is_featured_display_until_idx" ON "QuoteSubmission"("approved", "is_featured", "display_until");
