-- Create LyricCompetition and related tables missing from init migration

-- ============================================
-- 1. Create LyricCompetition
-- ============================================
CREATE TABLE "LyricCompetition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'monthly',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "slug" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submissionDeadline" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bannerUrl" TEXT,
    "shortDescription" TEXT,
    "socialSharingText" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LyricCompetition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LyricCompetition_slug_key" ON "LyricCompetition"("slug");
CREATE INDEX IF NOT EXISTS "LyricCompetition_status_is_active_idx" ON "LyricCompetition"("status", "is_active");
CREATE INDEX IF NOT EXISTS "LyricCompetition_startDate_endDate_idx" ON "LyricCompetition"("startDate", "endDate");
CREATE INDEX IF NOT EXISTS "LyricCompetition_createdAt_idx" ON "LyricCompetition"("createdAt");

-- ============================================
-- 2. Create CompetitionRule
-- ============================================
CREATE TABLE "CompetitionRule" (
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
CREATE INDEX IF NOT EXISTS "CompetitionRule_competitionId_idx" ON "CompetitionRule"("competitionId");

-- ============================================
-- 3. Create CompetitionPrize
-- ============================================
CREATE TABLE "CompetitionPrize" (
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

-- ============================================
-- 4. Create Subscriber (formerly CompetitionSubscriber)
-- ============================================
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "competitionId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT '',
    "consentStatus" TEXT NOT NULL DEFAULT 'granted',
    "consentTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "unsubscribedAt" TIMESTAMP(3),
    "lastEmailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_competitionId_email_key" ON "Subscriber"("competitionId", "email");
CREATE INDEX IF NOT EXISTS "Subscriber_email_idx" ON "Subscriber"("email");
CREATE INDEX IF NOT EXISTS "Subscriber_subscriptionStatus_idx" ON "Subscriber"("subscriptionStatus");
CREATE INDEX IF NOT EXISTS "Subscriber_source_idx" ON "Subscriber"("source");

-- ============================================
-- 5. Create LyricSubmission
-- ============================================
CREATE TABLE "LyricSubmission" (
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

-- ============================================
-- 6. Create SubmissionModeration
-- ============================================
CREATE TABLE "SubmissionModeration" (
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

-- ============================================
-- 7. Create CompetitionParticipant
-- ============================================
CREATE TABLE "CompetitionParticipant" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submissionCount" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CompetitionParticipant_competitionId_userId_key" ON "CompetitionParticipant"("competitionId", "userId");

-- ============================================
-- 8. Create Winner
-- ============================================
CREATE TABLE "Winner" (
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

-- ============================================
-- 9. Create CompetitionAnalytics
-- ============================================
CREATE TABLE "CompetitionAnalytics" (
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

-- ============================================
-- 10. Create EmailCampaign
-- ============================================
CREATE TABLE "EmailCampaign" (
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

-- ============================================
-- 11. Foreign Keys
-- ============================================
ALTER TABLE "CompetitionRule" ADD CONSTRAINT "CompetitionRule_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitionPrize" ADD CONSTRAINT "CompetitionPrize_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LyricSubmission" ADD CONSTRAINT "LyricSubmission_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubmissionModeration" ADD CONSTRAINT "SubmissionModeration_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "LyricSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitionParticipant" ADD CONSTRAINT "CompetitionParticipant_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Winner" ADD CONSTRAINT "Winner_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Winner" ADD CONSTRAINT "Winner_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "CompetitionPrize"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Winner" ADD CONSTRAINT "Winner_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "LyricSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CompetitionAnalytics" ADD CONSTRAINT "CompetitionAnalytics_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
