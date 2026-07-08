-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Slogan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "text" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT NOT NULL,
    "cover_url" TEXT NOT NULL,
    "distribution_links" TEXT,
    "publisher_link" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuoteSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quote_text" TEXT NOT NULL,
    "submitted_by" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "display_until" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GraffitiSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "image_url" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "display_until" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LyricGame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lyric_text" TEXT NOT NULL,
    "correct_artist" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Song_is_active_idx" ON "Song"("is_active");

-- CreateIndex
CREATE INDEX "QuoteSubmission_approved_is_featured_idx" ON "QuoteSubmission"("approved", "is_featured");

-- CreateIndex
CREATE INDEX "QuoteSubmission_display_until_idx" ON "QuoteSubmission"("display_until");

-- CreateIndex
CREATE INDEX "GraffitiSubmission_approved_idx" ON "GraffitiSubmission"("approved");

-- CreateIndex
CREATE INDEX "GraffitiSubmission_display_until_idx" ON "GraffitiSubmission"("display_until");

-- CreateIndex
CREATE INDEX "LyricGame_is_active_idx" ON "LyricGame"("is_active");
