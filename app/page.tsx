import { prisma } from './db';
import Hero from '@/components/Hero';
import LatestRelease from '@/components/LatestRelease';
import CommunityQuote from '@/components/CommunityQuote';
import GraffitiShowcase from '@/components/GraffitiShowcase';
import LyricGame from '@/components/LyricGame';

// Revalidate every 60 seconds
export const revalidate = 60;

const DEFAULT_SLOGAN = 'Built From Bars. Raised By Beats.';

export default async function Home() {
  // Fetch all data in parallel
  const [sloganEntry, activeSong, featuredQuote, graffitiItems, lyrics] = await Promise.all([
    prisma.slogan.findUnique({ where: { id: 1 } }),
    prisma.song.findFirst({ where: { is_active: true }, orderBy: { updatedAt: 'desc' } }),
    prisma.quoteSubmission.findFirst({
      where: {
        approved: true,
        is_featured: true,
        OR: [{ display_until: null }, { display_until: { gte: new Date() } }],
      },
    }),
    prisma.graffitiSubmission.findMany({
      where: {
        approved: true,
        OR: [{ display_until: null }, { display_until: { gte: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.lyricGame.findMany({
      where: { is_active: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const slogan = sloganEntry?.text ?? DEFAULT_SLOGAN;

  return (
    <>
      <Hero slogan={slogan} />
      <LatestRelease song={activeSong} />
      <CommunityQuote featuredQuote={featuredQuote ? {
        id: featuredQuote.id,
        quote_text: featuredQuote.quote_text,
        submitted_by: featuredQuote.submitted_by,
      } : null} />
      <GraffitiShowcase graffiti={(graffitiItems || []).map((g) => ({
        id: g.id,
        image_url: g.image_url,
        artist_name: g.artist_name,
      }))} />
      <LyricGame gameData={lyrics && lyrics.length > 0 ? {
        id: lyrics[0].id,
        lyric_snippet: lyrics[0].lyric_text,
        correct_song: lyrics[0].correct_artist,
        options: [lyrics[0].correct_artist, "Dr. Dre", "Snoop Dogg", "Ice Cube"].sort(() => Math.random() - 0.5)
      } : null} />
    </>
  );
}
