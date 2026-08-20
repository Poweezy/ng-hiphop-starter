-- Best Lyrics Portal — Manual Migration
-- Applied via: prisma db execute --file ./prisma/migrations/manual-best-lyrics.sql --schema prisma/schema.prisma

-- 1. Expand LyricCompetition
ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "submissionDeadline" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT;
ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "shortDescription" TEXT;
ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "socialSharingText" TEXT;
ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "LyricCompetition" DROP COLUMN IF EXISTS "winnerId";
ALTER TABLE "LyricCompetition" DROP COLUMN IF EXISTS "period";

CREATE UNIQUE INDEX IF NOT EXISTS "LyricCompetition_slug_key" ON "LyricCompetition"("slug");
CREATE INDEX IF NOT EXISTS "LyricCompetition_status_is_active_idx" ON "LyricCompetition"("status", "is_active");

-- 2. Rename CompetitionSubscriber -> Subscriber and expand
ALTER TABLE "CompetitionSubscriber" RENAME TO "Subscriber";
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "consentStatus" TEXT NOT NULL DEFAULT 'granted';
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "consentTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "unsubscribedAt" TIMESTAMP(3);
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "lastEmailSentAt" TIMESTAMP(3);
ALTER TABLE "Subscriber" DROP COLUMN IF EXISTS "subscribedAt";
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3. Create CompetitionRule
CREATE TABLE IF NOT EXISTS "CompetitionRule" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "minLength" INTEGER,
    "maxLength" INTEGER,
    "originalityRequired" BOOLEAN NOT NULL DEFAULT true,
    "copyrightRequirements" TEXT,
    "maxSubmissionsPerUser" INTEGER NOT NULL DEFAULT 1,
    "eligibilityRequirements" TEXT,
    "ageRestriction" TEXT,
    "moderationRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CompetitionRule_competitionId_key" ON "CompetitionRule"("competitionId");

-- 4. Create CompetitionPrize
CREATE TABLE IF NOT EXISTS "CompetitionPrize" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "cashAmount" DECIMAL(10,2),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionPrize_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CompetitionPrize_competitionId_position_key" ON "CompetitionPrize"("competitionId", "position");
CREATE INDEX IF NOT EXISTS "CompetitionPrize_competitionId_idx" ON "CompetitionPrize"("competitionId");

-- 5. Create LyricSubmission
CREATE TABLE IF NOT EXISTS "LyricSubmission" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "artistAlias" TEXT NOT NULL,
    "userId" TEXT,
    "lyrics" TEXT NOT NULL,
    "songTitle" TEXT,
    "audioUrl" TEXT,
    "socialLinks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "moderationStatus" TEXT NOT NULL DEFAULT 'pending',
    "moderationNotes" TEXT,
    "moderationReason" TEXT,
    "score" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "copyrightAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LyricSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LyricSubmission_competitionId_status_idx" ON "LyricSubmission"("competitionId", "status");
CREATE INDEX IF NOT EXISTS "LyricSubmission_competitionId_createdAt_idx" ON "LyricSubmission"("competitionId", "createdAt");
CREATE INDEX IF NOT EXISTS "LyricSubmission_userId_idx" ON "LyricSubmission"("userId");

-- 6. Create SubmissionModeration
CREATE TABLE IF NOT EXISTS "SubmissionModeration" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "moderatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionModeration_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SubmissionModeration_submissionId_idx" ON "SubmissionModeration"("submissionId");

-- 7. Create CompetitionParticipant
CREATE TABLE IF NOT EXISTS "CompetitionParticipant" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submissionCount" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CompetitionParticipant_competitionId_userId_key" ON "CompetitionParticipant"("competitionId", "userId");

-- 8. Create Winner
CREATE TABLE IF NOT EXISTS "Winner" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "prizeId" TEXT,
    "submissionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "prizeName" TEXT,
    "cashAmount" DECIMAL(10,2),
    "winningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selectedBy" TEXT,
    "announcementStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Winner_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Winner_competitionId_position_key" ON "Winner"("competitionId", "position");
CREATE UNIQUE INDEX IF NOT EXISTS "Winner_submissionId_key" ON "Winner"("submissionId");
CREATE INDEX IF NOT EXISTS "Winner_competitionId_idx" ON "Winner"("competitionId");
CREATE INDEX IF NOT EXISTS "Winner_submissionId_idx" ON "Winner"("submissionId");

-- 9. Create CompetitionAnalytics
CREATE TABLE IF NOT EXISTS "CompetitionAnalytics" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
    "uniqueParticipants" INTEGER NOT NULL DEFAULT 0,
    "approvedSubmissions" INTEGER NOT NULL DEFAULT 0,
    "rejectedSubmissions" INTEGER NOT NULL DEFAULT 0,
    "subscribersGenerated" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DECIMAL(5,2),
    "winners" INTEGER NOT NULL DEFAULT 0,
    "prizeValue" DECIMAL(10,2),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionAnalytics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CompetitionAnalytics_competitionId_key" ON "CompetitionAnalytics"("competitionId");

-- 10. Create EmailCampaign
CREATE TABLE IF NOT EXISTS "EmailCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "recipientFilter" TEXT,
    "recipientIds" TEXT,
    "sentAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- 11. Foreign keys for new tables
ALTER TABLE "CompetitionRule" ADD CONSTRAINT "CompetitionRule_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitionPrize" ADD CONSTRAINT "CompetitionPrize_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LyricSubmission" ADD CONSTRAINT "LyricSubmission_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubmissionModeration" ADD CONSTRAINT "SubmissionModeration_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "LyricSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitionParticipant" ADD CONSTRAINT "CompetitionParticipant_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Winner" ADD CONSTRAINT "Winner_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Winner" ADD CONSTRAINT "Winner_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "CompetitionPrize"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Winner" ADD CONSTRAINT "Winner_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "LyricSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CompetitionAnalytics" ADD CONSTRAINT "CompetitionAnalytics_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
