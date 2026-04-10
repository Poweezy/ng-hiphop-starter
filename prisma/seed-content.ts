/**
 * seed-content.ts
 * Injects approved community quotes, graffiti, and fixes placeholder song
 * into the existing dev database without wiping other data.
 * Run: npx tsx prisma/seed-content.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding community content...');

  // ── Deactivate the placeholder seed song ─────────────────────────────────
  await prisma.song.updateMany({
    where: { title: { contains: 'Placeholder' } },
    data: { is_active: false },
  });
  console.log('✅ Placeholder song deactivated');

  // ── Approved & Featured Community Quotes ─────────────────────────────────
  const quotes = [
    {
      quote_text: "Hip-hop is more than music — it's the heartbeat of a generation.",
      submitted_by: 'STREET_PROPHET',
    },
    {
      quote_text: "Every bar dropped is a page written in the book of culture.",
      submitted_by: 'INK_WARRIOR',
    },
    {
      quote_text: "We came from nothing, and we made everything mean something.",
      submitted_by: 'CIPHER_KING',
    },
    {
      quote_text: "The mic doesn't lie. Put your truth on it.",
      submitted_by: 'REALA_T',
    },
    {
      quote_text: "Flows over gold. Bars over cars. Culture over clout.",
      submitted_by: 'VERDAD',
    },
  ];

  for (const q of quotes) {
    await prisma.quoteSubmission.create({
      data: {
        ...q,
        approved: true,
        is_featured: true,
      },
    });
  }
  console.log(`✅ ${quotes.length} community quotes seeded`);

  // ── Approved Graffiti Submissions ─────────────────────────────────────────
  // Using royalty-free / placeholder art image URLs that will load
  const graffiti = [
    {
      image_url: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&auto=format&fit=crop',
      artist_name: '@KRAZE',
    },
    {
      image_url: 'https://images.unsplash.com/photo-1490673191399-7df3ab0de001?w=600&auto=format&fit=crop',
      artist_name: '@RAZE_ONE',
    },
    {
      image_url: 'https://images.unsplash.com/photo-1547891654-e53eb9e64c83?w=600&auto=format&fit=crop',
      artist_name: '@VIZUAL_INK',
    },
    {
      image_url: 'https://images.unsplash.com/photo-1529258283598-8d6fe60b27f4?w=600&auto=format&fit=crop',
      artist_name: '@DARKWALL',
    },
    {
      image_url: 'https://images.unsplash.com/photo-1582038411222-f1a5fbbf4b3f?w=600&auto=format&fit=crop',
      artist_name: '@URBAN_TAG',
    },
    {
      image_url: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=600&auto=format&fit=crop',
      artist_name: '@NEON_GHOST',
    },
  ];

  for (const g of graffiti) {
    await prisma.graffitiSubmission.create({
      data: {
        ...g,
        approved: true,
      },
    });
  }
  console.log(`✅ ${graffiti.length} graffiti submissions seeded`);

  // ── Set first quote as the featured display ───────────────────────────────
  const firstQuote = await prisma.quoteSubmission.findFirst({
    where: { approved: true },
    orderBy: { createdAt: 'asc' },
  });
  if (firstQuote) {
    await prisma.quoteSubmission.update({
      where: { id: firstQuote.id },
      data: { is_featured: true },
    });
    console.log('✅ Featured quote set');
  }

  console.log('🎉 Community content seeded successfully!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
