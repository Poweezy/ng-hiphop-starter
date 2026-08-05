-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slogan" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "text" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slogan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT NOT NULL,
    "file_key" TEXT,
    "cover_url" TEXT NOT NULL,
    "cover_key" TEXT,
    "distribution_links" TEXT,
    "publisher_link" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteSubmission" (
    "id" TEXT NOT NULL,
    "quote_text" TEXT NOT NULL,
    "submitted_by" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "display_until" TIMESTAMP(3),
    "scan_clean" BOOLEAN NOT NULL DEFAULT true,
    "scan_result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraffitiSubmission" (
    "id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_key" TEXT,
    "artist_name" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "display_until" TIMESTAMP(3),
    "scan_clean" BOOLEAN NOT NULL DEFAULT true,
    "scan_result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraffitiSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LyricGame" (
    "id" TEXT NOT NULL,
    "lyric_text" TEXT NOT NULL,
    "correct_artist" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LyricGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nextRetryAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Song_is_active_idx" ON "Song"("is_active");

-- CreateIndex
CREATE INDEX "Song_createdAt_idx" ON "Song"("createdAt");

-- CreateIndex
CREATE INDEX "QuoteSubmission_approved_is_featured_display_until_idx" ON "QuoteSubmission"("approved", "is_featured", "display_until");

-- CreateIndex
CREATE INDEX "QuoteSubmission_display_until_idx" ON "QuoteSubmission"("display_until");

-- CreateIndex
CREATE INDEX "QuoteSubmission_createdAt_idx" ON "QuoteSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "GraffitiSubmission_approved_display_until_idx" ON "GraffitiSubmission"("approved", "display_until");

-- CreateIndex
CREATE INDEX "GraffitiSubmission_display_until_idx" ON "GraffitiSubmission"("display_until");

-- CreateIndex
CREATE INDEX "GraffitiSubmission_createdAt_idx" ON "GraffitiSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "LyricGame_is_active_idx" ON "LyricGame"("is_active");

-- CreateIndex
CREATE INDEX "LyricGame_createdAt_idx" ON "LyricGame"("createdAt");

-- CreateIndex
CREATE INDEX "Job_status_createdAt_idx" ON "Job"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Job_nextRetryAt_idx" ON "Job"("nextRetryAt");
