-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GraffitiSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "image_url" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "display_until" DATETIME,
    "scan_clean" BOOLEAN NOT NULL DEFAULT true,
    "scan_result" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GraffitiSubmission" ("approved", "artist_name", "createdAt", "display_until", "id", "image_url", "updatedAt") SELECT "approved", "artist_name", "createdAt", "display_until", "id", "image_url", "updatedAt" FROM "GraffitiSubmission";
DROP TABLE "GraffitiSubmission";
ALTER TABLE "new_GraffitiSubmission" RENAME TO "GraffitiSubmission";
CREATE INDEX "GraffitiSubmission_approved_display_until_idx" ON "GraffitiSubmission"("approved", "display_until");
CREATE INDEX "GraffitiSubmission_display_until_idx" ON "GraffitiSubmission"("display_until");
CREATE TABLE "new_QuoteSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quote_text" TEXT NOT NULL,
    "submitted_by" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "display_until" DATETIME,
    "scan_clean" BOOLEAN NOT NULL DEFAULT true,
    "scan_result" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_QuoteSubmission" ("approved", "createdAt", "display_until", "id", "is_featured", "quote_text", "submitted_by", "updatedAt") SELECT "approved", "createdAt", "display_until", "id", "is_featured", "quote_text", "submitted_by", "updatedAt" FROM "QuoteSubmission";
DROP TABLE "QuoteSubmission";
ALTER TABLE "new_QuoteSubmission" RENAME TO "QuoteSubmission";
CREATE INDEX "QuoteSubmission_approved_is_featured_display_until_idx" ON "QuoteSubmission"("approved", "is_featured", "display_until");
CREATE INDEX "QuoteSubmission_display_until_idx" ON "QuoteSubmission"("display_until");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
