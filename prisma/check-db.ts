import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const quotes = await prisma.quoteSubmission.count({ where: { approved: true } });
  const graffiti = await prisma.graffitiSubmission.count({ where: { approved: true } });
  const activeSongs = await prisma.song.count({ where: { is_active: true } });
  const allSongs = await prisma.song.count();
  const featured = await prisma.quoteSubmission.findFirst({ where: { is_featured: true, approved: true } });
  console.log('Approved quotes:', quotes);
  console.log('Approved graffiti:', graffiti);
  console.log('Active songs:', activeSongs, '/ total:', allSongs);
  console.log('Featured quote:', featured?.quote_text ?? 'NONE');
  await prisma.$disconnect();
}
check();
