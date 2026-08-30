import { prisma } from '@/app/db';
import { Metadata } from 'next';
import BestLyricsPortalClient from '@/components/BestLyricsPortalClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Best Lyrics Competition',
  description: 'Drop your hardest bars. Let the community decide. Join the Best Lyrics competition, submit your lyrics, and compete for the prize pool.',
  alternates: {
    canonical: '/game/best-lyrics',
  },
  openGraph: {
    title: 'Best Lyrics — Nerd Gauge',
    description: 'Drop your hardest bars. Let the community decide.',
    url: 'https://ng-hiphop.com/game/best-lyrics',
    siteName: 'Nerd Gauge',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Best Lyrics Competition — Nerd Gauge',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best Lyrics — Nerd Gauge',
    description: 'Drop your hardest bars. Let the community decide.',
    images: ['/twitter-image.jpg'],
  },
};

export default async function BestLyricsPage() {
  let competition: {
    id: string;
    title: string;
    description: string | null;
    shortDescription: string | null;
    type: string;
    startDate: string;
    endDate: string;
    submissionDeadline: string;
    rules: {
      minLength: number | null;
      maxLength: number | null;
      originalityRequired: boolean;
      copyrightRequirements: string | null;
      maxSubmissionsPerUser: number;
    } | null;
    prizes: {
      id: string;
      position: number;
      name: string;
      cashAmount: number | null;
      description: string | null;
    }[];
  } | null = null;
  let winners: {
    id: string;
    position: number;
    prizeName: string | null;
    cashAmount: number | null;
    submission: {
      artistAlias: string;
      lyrics: string;
      songTitle: string | null;
    };
  }[] = [];
  let recentSubmissions: {
    id: string;
    artistAlias: string;
    lyrics: string;
    songTitle: string | null;
    createdAt: string;
  }[] = [];
  let subscriberCount = 0;

  try {
    const activeCompetition = await prisma.lyricCompetition.findFirst({
      where: { is_active: true, status: 'published' },
      include: {
        rules: true,
        prizes: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (activeCompetition) {
      competition = {
        id: activeCompetition.id,
        title: activeCompetition.title,
        description: activeCompetition.description,
        shortDescription: activeCompetition.shortDescription,
        type: activeCompetition.type,
        startDate: activeCompetition.startDate.toISOString(),
        endDate: activeCompetition.endDate.toISOString(),
        submissionDeadline: activeCompetition.submissionDeadline.toISOString(),
        rules: activeCompetition.rules
          ? {
              minLength: activeCompetition.rules.minLength,
              maxLength: activeCompetition.rules.maxLength,
              originalityRequired: activeCompetition.rules.originalityRequired,
              copyrightRequirements: activeCompetition.rules.copyrightRequirements,
              maxSubmissionsPerUser: activeCompetition.rules.maxSubmissionsPerUser,
            }
          : null,
        prizes: activeCompetition.prizes.map((p) => ({
          id: p.id,
          position: p.position,
          name: p.name,
          cashAmount: p.cashAmount ? Number(p.cashAmount) : null,
          description: p.description,
        })),
      };

      const [winnersData, submissionsData, subscribersData] = await Promise.all([
        prisma.winner.findMany({
          where: { competitionId: activeCompetition.id },
          include: {
            prize: true,
            submission: {
              select: {
                artistAlias: true,
                lyrics: true,
                songTitle: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        }),
        prisma.lyricSubmission.findMany({
          where: { competitionId: activeCompetition.id, status: 'approved' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            artistAlias: true,
            lyrics: true,
            songTitle: true,
            createdAt: true,
          },
        }),
        prisma.subscriber.count({
          where: { competitionId: activeCompetition.id, subscriptionStatus: 'active' },
        }),
      ]);

      winners = winnersData.map((w) => ({
        id: w.id,
        position: w.position,
        prizeName: w.prizeName,
        cashAmount: w.cashAmount ? Number(w.cashAmount) : null,
        submission: {
          artistAlias: w.submission.artistAlias,
          lyrics: w.submission.lyrics,
          songTitle: w.submission.songTitle,
        },
      }));

      recentSubmissions = submissionsData.map((s) => ({
        id: s.id,
        artistAlias: s.artistAlias,
        lyrics: s.lyrics,
        songTitle: s.songTitle,
        createdAt: s.createdAt.toISOString(),
      }));

      subscriberCount = subscribersData;
    }
  } catch {
    // Database unavailable during build or runtime — render with empty data
  }

  return (
    <BestLyricsPortalClient
      competition={competition}
      winners={winners}
      recentSubmissions={recentSubmissions}
      subscriberCount={subscriberCount}
    />
  );
}
