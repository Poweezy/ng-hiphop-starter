import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected!');

    // Try the rename
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "CompetitionSubscriber" RENAME TO "Subscriber"`);
      console.log('Rename succeeded!');
    } catch (e: any) {
      console.log('Rename failed:', e.message);
    }

    // Check tables after
    const tables = await prisma.$queryRaw<any[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
    console.log('Tables after:', tables.map(t => t.tablename).join(', '));

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
