import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected!');

    const cols = await prisma.$queryRaw<any[]>`SELECT column_name FROM information_schema.columns WHERE table_name = '_prisma_migrations' ORDER BY ordinal_position`;
    console.log('Migration table columns:', cols.map(c => c.column_name).join(', '));

    const migrations = await prisma.$queryRaw<any[]>`SELECT * FROM "_prisma_migrations" ORDER BY migration_name`;
    console.log('Migrations:', JSON.stringify(migrations, null, 2));

  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
