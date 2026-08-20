import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected!');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Query result:', result);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
