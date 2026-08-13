import { prisma } from './db';
import Hero from '@/components/Hero';
import LatestRelease from '@/components/LatestRelease';
import CommunityQuote from '@/components/CommunityQuote';
import GraffitiShowcase from '@/components/GraffitiShowcase';
import LyricGame from '@/components/LyricGame';
import CompetitionBanner from '@/components/CompetitionBanner';

// Revalidate every 60 seconds
export const revalidate = 60;

const DEFAULT_SLOGAN = 'Built From Bars. Raised By Beats.';

export default async function Home() {
  let sloganEntry: { text: string } | null = null;
  let activeSong: { id: string; title: string; description: string | null; file_url: string; cover_url: string; distribution_links: string | null; publisher_link: string | null } | null = null;
  let featuredQuote: { id: string; quote_text: string; submitted_by: string } | null = null;
  let graffitiItems: { id: string; image_url: string; artist_name: string }[] = [];
  let lyrics: { id: string; lyric_text: string; correct_artist: string }[] = [];
  let activeCompetition: { id: string; title: string; period: string; endDate: string; is_active: boolean; winnerId: string | null } | null = null;
  let winner: { lyric_text: string; correct_artist: string } | null = null;

  try {
    const competitionResult = await prisma.lyricCompetition.findFirst({
      where: { is_active: true },
      orderBy: { createdAt: 'desc' },
    });

    [sloganEntry, activeSong, featuredQuote, graffitiItems, lyrics] = await Promise.all([
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

    if (competitionResult) {
      activeCompetition = {
        ...competitionResult,
        endDate: competitionResult.endDate.toISOString(),
      };
    }

    if (activeCompetition?.winnerId) {
      const winnerLyric = await prisma.lyricGame.findUnique({
        where: { id: activeCompetition.winnerId },
        select: { lyric_text: true, correct_artist: true },
      });
      if (winnerLyric) {
        winner = winnerLyric;
      }
    }
  } catch {
    // Database unavailable during build or runtime — render with empty data
  }

  const slogan = sloganEntry?.text ?? DEFAULT_SLOGAN;

  return (
    <>
      <Hero slogan={slogan} />
      <LatestRelease song={activeSong} />
      <CommunityQuote featuredQuote={featuredQuote} />
      <GraffitiShowcase graffiti={graffitiItems} />
      {activeCompetition && <CompetitionBanner competition={activeCompetition} winner={winner} />}
      <LyricGame lyrics={lyrics} />
    </>
  );
}
