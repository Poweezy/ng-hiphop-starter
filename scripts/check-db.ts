import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected!');

    // Check existing tables
    const tables = await prisma.$queryRaw<any[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
    console.log('Existing tables:', tables.map(t => t.tablename).join(', '));

    // Check if CompetitionSubscriber exists
    const cs = await prisma.$queryRaw<any[]>`SELECT * FROM "CompetitionSubscriber" LIMIT 1`;
    console.log('CompetitionSubscriber rows:', cs.length);

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
