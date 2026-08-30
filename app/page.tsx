import { prisma } from './db';
import { Metadata } from 'next';
import Hero from '@/components/Hero';
import LatestRelease from '@/components/LatestRelease';
import CommunityQuote from '@/components/CommunityQuote';
import GraffitiShowcase from '@/components/GraffitiShowcase';
import CompetitionBanner from '@/components/CompetitionBanner';

// Revalidate every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
    title: 'Nerd Gauge — Built From Bars. Raised By Beats.',
    description: 'The official platform for Nerd Gauge. Stream the latest releases, explore community quotes, graffiti art, and join the lyric competition movement from Eswatini.',
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Nerd Gauge — Built From Bars. Raised By Beats.',
        description: 'Stream the latest releases, explore community quotes, graffiti art, and join the lyric competition movement.',
        url: 'https://ng-hiphop.com',
        siteName: 'Nerd Gauge',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Nerd Gauge Platform — Built From Bars. Raised By Beats.',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Nerd Gauge — Built From Bars. Raised By Beats.',
        description: 'Stream the latest releases, explore community quotes, graffiti art, and join the lyric competition movement.',
        creator: '@nghiphop',
        images: ['/twitter-image.jpg'],
    },
};

const DEFAULT_SLOGAN = 'Built From Bars. Raised By Beats.';

export default async function Home() {
  let sloganEntry: { text: string } | null = null;
  let activeSong: { id: string; title: string; description: string | null; file_url: string; cover_url: string; distribution_links: string | null; publisher_link: string | null } | null = null;
  let featuredQuote: { id: string; quote_text: string; submitted_by: string } | null = null;
  let graffitiItems: { id: string; image_url: string; artist_name: string }[] = [];
  let activeCompetition: { id: string; title: string; type: string; endDate: string; is_active: boolean } | null = null;
  let winner: { lyric_text: string; correct_artist: string } | null = null;

  try {
    const competitionResult = await prisma.lyricCompetition.findFirst({
      where: { is_active: true, status: 'published' },
      orderBy: { createdAt: 'desc' },
    });

    if (competitionResult) {
      activeCompetition = {
        ...competitionResult,
        endDate: competitionResult.endDate.toISOString(),
      };
    }

    [sloganEntry, activeSong, featuredQuote, graffitiItems] = await Promise.all([
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
    ]);

    if (activeCompetition) {
      const winnerRecord = await prisma.winner.findFirst({
        where: { competitionId: activeCompetition.id },
        include: { submission: { select: { lyrics: true, artistAlias: true } } },
      });
      if (winnerRecord?.submission) {
        winner = {
          lyric_text: winnerRecord.submission.lyrics,
          correct_artist: winnerRecord.submission.artistAlias,
        };
      }
    }
  } catch (error) {
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    if (!isBuildPhase) {
      console.error('Home page data fetch failed:', error);
    }
  }

  const slogan = sloganEntry?.text ?? DEFAULT_SLOGAN;

  return (
    <>
      <Hero slogan={slogan} />
      <LatestRelease song={activeSong} />
      <CommunityQuote featuredQuote={featuredQuote} />
      <GraffitiShowcase graffiti={graffitiItems} />
      {activeCompetition && <CompetitionBanner competition={activeCompetition} winner={winner} />}
    </>
  );
}
