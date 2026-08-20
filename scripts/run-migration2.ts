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
    console.log(`  FAIL: ${label} — ${e.message?.substring(0, 100)}`);
  }
}

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected!');

    // 1. Expand LyricCompetition
    console.log('\nExpanding LyricCompetition...');
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

    // 2. Expand Subscriber (renamed from CompetitionSubscriber)
    console.log('\nExpanding Subscriber...');
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

    // 3. Create new tables
    console.log('\nCreating new tables...');
    await exec(`CREATE TABLE IF NOT EXISTS "CompetitionRule" (...)`, 'CompetitionRule');
    
    console.log('\nDone!');
  } catch (e) {
    console.error('Fatal error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
