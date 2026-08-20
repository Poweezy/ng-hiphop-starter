import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected!');

    const tables = await prisma.$queryRaw<any[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
    console.log('\nTables:', tables.map(t => t.tablename).join('\n  '));

    // Check columns on key tables
    const lyricCompCols = await prisma.$queryRaw<any[]>`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'LyricCompetition' ORDER BY ordinal_position`;
    console.log('\nLyricCompetition columns:', lyricCompCols.map(c => `${c.column_name} (${c.data_type})`).join('\n  '));

    const subscriberCols = await prisma.$queryRaw<any[]>`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Subscriber' ORDER BY ordinal_position`;
    console.log('\nSubscriber columns:', subscriberCols.map(c => `${c.column_name} (${c.data_type})`).join('\n  '));

    const newTables = ['CompetitionRule', 'CompetitionPrize', 'LyricSubmission', 'SubmissionModeration', 'CompetitionParticipant', 'Winner', 'CompetitionAnalytics', 'EmailCampaign'];
    for (const table of newTables) {
      const exists = await prisma.$queryRaw<any[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = ${table}`;
      console.log(`${table}: ${exists.length > 0 ? 'EXISTS' : 'MISSING'}`);
    }

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
