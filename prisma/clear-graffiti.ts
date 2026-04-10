import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.graffitiSubmission.deleteMany({});
  console.log(`🗑️  Removed ${deleted.count} graffiti entries — wall is empty again.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
