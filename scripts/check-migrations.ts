import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected!');

    const migrations = await prisma.$queryRaw<any[]>`SELECT * FROM "_prisma_migrations" ORDER BY "created_at"`;
    console.log('Migrations:', JSON.stringify(migrations, null, 2));

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
