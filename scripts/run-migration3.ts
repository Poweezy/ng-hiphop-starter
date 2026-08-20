import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  log: ['error'],
});

async function exec(sql: string, label: string) {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log(`  OK: ${label}`);
  } catch (e: any) {
    console.log(`  FAIL: ${label} — ${e.message?.substring(0, 120)}`);
  }
}

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected!');

    // 1. Expand LyricCompetition
    console.log('\n=== Expanding LyricCompetition ===');
    await exec(`ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "description" TEXT`, 'add description');
    await exec(`ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'monthly'`, 'add type');
    await exec(`ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft'`, 'add status');
    await exec(`ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "slug" TEXT`, 'add slug');
    await exec(`ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "submissionDeadline" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`, 'add submissionDeadline');
    await exec(`ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT`, 'add bannerUrl');
    await exec(`ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "shortDescription" TEXT`, 'add shortDescription');
    await exec(`ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "socialSharingText" TEXT`, 'add socialSharingText');
    await exec(`ALTER TABLE "LyricCompetition" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0`, 'add viewCount');
    await exec(`ALTER TABLE "LyricCompetition" DROP COLUMN IF EXISTS "winnerId"`, 'drop winnerId');
    await exec(`ALTER TABLE "LyricCompetition" DROP COLUMN IF EXISTS "period"`, 'drop period');
    await exec(`CREATE UNIQUE INDEX IF NOT EXISTS "LyricCompetition_slug_key" ON "LyricCompetition"("slug")`, 'idx slug');
    await exec(`CREATE INDEX IF NOT EXISTS "LyricCompetition_status_is_active_idx" ON "LyricCompetition"("status", "is_active")`, 'idx status');

    // 2. Rename CompetitionSubscriber -> Subscriber
    console.log('\n=== Renaming CompetitionSubscriber ===');
    await exec(`ALTER TABLE "CompetitionSubscriber" RENAME TO "Subscriber"`, 'rename to Subscriber');

    // 3. Expand Subscriber
    console.log('\n=== Expanding Subscriber ===');
    await exec(`ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "name" TEXT`, 'add name');
    await exec(`ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT ''`, 'add source');
    await exec(`ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "consentStatus" TEXT NOT NULL DEFAULT 'granted'`, 'add consentStatus');
    await exec(`ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "consentTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`, 'add consentTimestamp');
    await exec(`ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT NOT NULL DEFAULT 'active'`, 'add subscriptionStatus');
    await exec(`ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "unsubscribedAt" TIMESTAMP(3)`, 'add unsubscribedAt');
    await exec(`ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "lastEmailSentAt" TIMESTAMP(3)`, 'add lastEmailSentAt');
    await exec(`ALTER TABLE "Subscriber" DROP COLUMN IF EXISTS "subscribedAt"`, 'drop subscribedAt');
    await exec(`ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`, 'add createdAt');
    await exec(`ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`, 'add updatedAt');
    await exec(`CREATE INDEX IF NOT EXISTS "Subscriber_email_idx" ON "Subscriber"("email")`, 'idx email');
    await exec(`CREATE INDEX IF NOT EXISTS "Subscriber_subscriptionStatus_idx" ON "Subscriber"("subscriptionStatus")`, 'idx subscriptionStatus');
    await exec(`CREATE INDEX IF NOT EXISTS "Subscriber_source_idx" ON "Subscriber"("source")`, 'idx source');

    // 4. Create CompetitionRule
    console.log('\n=== Creating CompetitionRule ===');
    await exec(`CREATE TABLE IF NOT EXISTS "CompetitionRule" (
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
    )`, 'create CompetitionRule');
    await exec(`CREATE UNIQUE INDEX IF NOT EXISTS "CompetitionRule_competitionId_key" ON "CompetitionRule"("competitionId")`, 'idx CompetitionRule competitionId');

    // 5. Create CompetitionPrize
    console.log('\n=== Creating CompetitionPrize ===');
    await exec(`CREATE TABLE IF NOT EXISTS "CompetitionPrize" (
      "id" TEXT NOT NULL,
      "competitionId" TEXT NOT NULL,
      "position" INTEGER NOT NULL,
      "name" TEXT NOT NULL,
      "cashAmount" DECIMAL(10,2),
      "description" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompetitionPrize_pkey" PRIMARY KEY ("id")
    )`, 'create CompetitionPrize');
    await exec(`CREATE UNIQUE INDEX IF NOT EXISTS "CompetitionPrize_competitionId_position_key" ON "CompetitionPrize"("competitionId", "position")`, 'idx CompetitionPrize position');
    await exec(`CREATE INDEX IF NOT EXISTS "CompetitionPrize_competitionId_idx" ON "CompetitionPrize"("competitionId")`, 'idx CompetitionPrize competitionId');

    // 6. Create LyricSubmission
    console.log('\n=== Creating LyricSubmission ===');
    await exec(`CREATE TABLE IF NOT EXISTS "LyricSubmission" (
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
    )`, 'create LyricSubmission');
    await exec(`CREATE INDEX IF NOT EXISTS "LyricSubmission_competitionId_status_idx" ON "LyricSubmission"("competitionId", "status")`, 'idx LyricSubmission status');
    await exec(`CREATE INDEX IF NOT EXISTS "LyricSubmission_competitionId_createdAt_idx" ON "LyricSubmission"("competitionId", "createdAt")`, 'idx LyricSubmission createdAt');
    await exec(`CREATE INDEX IF NOT EXISTS "LyricSubmission_userId_idx" ON "LyricSubmission"("userId")`, 'idx LyricSubmission userId');

    // 7. Create SubmissionModeration
    console.log('\n=== Creating SubmissionModeration ===');
    await exec(`CREATE TABLE IF NOT EXISTS "SubmissionModeration" (
      "id" TEXT NOT NULL,
      "submissionId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "reason" TEXT,
      "notes" TEXT,
      "moderatedBy" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SubmissionModeration_pkey" PRIMARY KEY ("id")
    )`, 'create SubmissionModeration');
    await exec(`CREATE INDEX IF NOT EXISTS "SubmissionModeration_submissionId_idx" ON "SubmissionModeration"("submissionId")`, 'idx SubmissionModeration');

    // 8. Create CompetitionParticipant
    console.log('\n=== Creating CompetitionParticipant ===');
    await exec(`CREATE TABLE IF NOT EXISTS "CompetitionParticipant" (
      "id" TEXT NOT NULL,
      "competitionId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "submissionCount" INTEGER NOT NULL DEFAULT 0,
      "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CompetitionParticipant_pkey" PRIMARY KEY ("id")
    )`, 'create CompetitionParticipant');
    await exec(`CREATE UNIQUE INDEX IF NOT EXISTS "CompetitionParticipant_competitionId_userId_key" ON "CompetitionParticipant"("competitionId", "userId")`, 'idx participant unique');

    // 9. Create Winner
    console.log('\n=== Creating Winner ===');
    await exec(`CREATE TABLE IF NOT EXISTS "Winner" (
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
    )`, 'create Winner');
    await exec(`CREATE UNIQUE INDEX IF NOT EXISTS "Winner_competitionId_position_key" ON "Winner"("competitionId", "position")`, 'idx Winner position');
    await exec(`CREATE UNIQUE INDEX IF NOT EXISTS "Winner_submissionId_key" ON "Winner"("submissionId")`, 'idx Winner submission');
    await exec(`CREATE INDEX IF NOT EXISTS "Winner_competitionId_idx" ON "Winner"("competitionId")`, 'idx Winner competition');
    await exec(`CREATE INDEX IF NOT EXISTS "Winner_submissionId_idx" ON "Winner"("submissionId")`, 'idx Winner submission2');

    // 10. Create CompetitionAnalytics
    console.log('\n=== Creating CompetitionAnalytics ===');
    await exec(`CREATE TABLE IF NOT EXISTS "CompetitionAnalytics" (
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
    )`, 'create CompetitionAnalytics');
    await exec(`CREATE UNIQUE INDEX IF NOT EXISTS "CompetitionAnalytics_competitionId_key" ON "CompetitionAnalytics"("competitionId")`, 'idx Analytics');

    // 11. Create EmailCampaign
    console.log('\n=== Creating EmailCampaign ===');
    await exec(`CREATE TABLE IF NOT EXISTS "EmailCampaign" (
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
    )`, 'create EmailCampaign');

    // 12. Foreign keys
    console.log('\n=== Adding Foreign Keys ===');
    await exec(`ALTER TABLE "CompetitionRule" ADD CONSTRAINT "CompetitionRule_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE`, 'fk CompetitionRule');
    await exec(`ALTER TABLE "CompetitionPrize" ADD CONSTRAINT "CompetitionPrize_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE`, 'fk CompetitionPrize');
    await exec(`ALTER TABLE "LyricSubmission" ADD CONSTRAINT "LyricSubmission_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE`, 'fk LyricSubmission');
    await exec(`ALTER TABLE "SubmissionModeration" ADD CONSTRAINT "SubmissionModeration_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "LyricSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE`, 'fk SubmissionModeration');
    await exec(`ALTER TABLE "CompetitionParticipant" ADD CONSTRAINT "CompetitionParticipant_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE`, 'fk CompetitionParticipant');
    await exec(`ALTER TABLE "Winner" ADD CONSTRAINT "Winner_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE`, 'fk Winner competition');
    await exec(`ALTER TABLE "Winner" ADD CONSTRAINT "Winner_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "CompetitionPrize"("id") ON DELETE SET NULL ON UPDATE CASCADE`, 'fk Winner prize');
    await exec(`ALTER TABLE "Winner" ADD CONSTRAINT "Winner_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "LyricSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE`, 'fk Winner submission');
    await exec(`ALTER TABLE "CompetitionAnalytics" ADD CONSTRAINT "CompetitionAnalytics_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE`, 'fk Analytics');
    await exec(`ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "LyricCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE`, 'fk Subscriber');

    console.log('\n=== Migration complete! ===');
  } catch (e) {
    console.error('Fatal error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
