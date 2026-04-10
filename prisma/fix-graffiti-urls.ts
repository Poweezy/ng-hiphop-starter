/**
 * fix-graffiti-urls.ts
 * Replaces broken Unsplash URLs with reliable picsum.photos images.
 * Run: npx tsx prisma/fix-graffiti-urls.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Reliable placeholder street-art style images from picsum.photos
// Using fixed seeds so they're consistent on every run
const RELIABLE_IMAGES = [
  {
    image_url: 'https://picsum.photos/seed/graffiti1/600/450',
    artist_name: '@KRAZE',
  },
  {
    image_url: 'https://picsum.photos/seed/graffiti2/600/450',
    artist_name: '@RAZE_ONE',
  },
  {
    image_url: 'https://picsum.photos/seed/graffiti3/600/450',
    artist_name: '@VIZUAL_INK',
  },
  {
    image_url: 'https://picsum.photos/seed/graffiti4/600/450',
    artist_name: '@DARKWALL',
  },
  {
    image_url: 'https://picsum.photos/seed/graffiti5/600/450',
    artist_name: '@URBAN_TAG',
  },
  {
    image_url: 'https://picsum.photos/seed/graffiti6/600/450',
    artist_name: '@NEON_GHOST',
  },
];

async function main() {
  console.log('🔧 Fixing graffiti image URLs...');

  // Delete all existing graffiti submissions
  const deleted = await prisma.graffitiSubmission.deleteMany({});
  console.log(`🗑️  Removed ${deleted.count} old entries`);

  // Re-seed with reliable URLs
  for (const g of RELIABLE_IMAGES) {
    await prisma.graffitiSubmission.create({
      data: {
        ...g,
        approved: true,
      },
    });
  }

  console.log(`✅ Re-seeded ${RELIABLE_IMAGES.length} graffiti submissions with working URLs`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
