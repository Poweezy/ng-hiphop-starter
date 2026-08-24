import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { prisma } from '@/app/db';
import type { SongSummary, QuoteSummary, GraffitiSummary, CompetitionSummary, LyricSubmissionSummary, WinnerSummary, SubscriberSummary } from '@/lib/adminTypes';

export default async function AdminPage() {
    const session = await auth();
    const userRole = session?.user?.role ?? null;
    
    if (!session || userRole !== 'ADMIN') {
        redirect('/admin/login');
    }

    const [slogan, songs, quotes, graffiti, users, competitions, submissions, winners, subscribers] = await Promise.all([
        prisma.slogan.findUnique({ where: { id: 1 } }),
        prisma.song.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
        prisma.quoteSubmission.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
        prisma.graffitiSubmission.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
        prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
        prisma.lyricCompetition.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                _count: {
                    select: {
                        subscribers: true,
                        submissions: true,
                    },
                },
            },
        }),
        prisma.lyricSubmission.findMany({
            orderBy: { createdAt: 'desc' },
            take: 200,
            include: {
                competition: {
                    select: { id: true, title: true },
                },
            },
        }),
        prisma.winner.findMany({
            orderBy: { winningDate: 'desc' },
            take: 100,
            include: {
                submission: {
                    select: {
                        artistAlias: true,
                        lyrics: true,
                        songTitle: true,
                    },
                },
                competition: {
                    select: { id: true, title: true },
                },
            },
        }),
        prisma.subscriber.findMany({
            orderBy: { createdAt: 'desc' },
            take: 200,
            include: {
                competition: {
                    select: { id: true, title: true },
                },
            },
        }),
    ]);

    const serializeDate = (value: Date | string | null) => {
        if (value instanceof Date) return value.toISOString();
        return value;
    };

    const serializeDecimal = (value: number | { toNumber(): number } | null | undefined) =>
        value != null ? (typeof value === 'number' ? value : value.toNumber()) : null;

    // Two grouped queries instead of 2×N per-user COUNT queries (N+1 fix):
    // admin page load cost no longer grows linearly with user count.
    const [quoteCountGroups, graffitiCountGroups] = await Promise.all([
        prisma.quoteSubmission.groupBy({
            by: ['submitted_by'],
            _count: { _all: true },
        }),
        prisma.graffitiSubmission.groupBy({
            by: ['artist_name'],
            _count: { _all: true },
        }),
    ]);
    const quoteCountByEmail = new Map(quoteCountGroups.map((g) => [g.submitted_by, g._count._all]));
    const graffitiCountByName = new Map(graffitiCountGroups.map((g) => [g.artist_name, g._count._all]));

    const usersWithData = users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        createdAt: serializeDate(u.createdAt) ?? new Date().toISOString(),
        updatedAt: serializeDate(u.updatedAt) ?? new Date().toISOString(),
        submissionCount:
            (quoteCountByEmail.get(u.email) ?? 0) +
            (graffitiCountByName.get(u.email) ?? 0),
    }));

    return (
        <AdminDashboard
            initialSlogan={slogan?.text ?? ''}
            initialSongs={songs.map(s => ({ ...s, distribution_links: s.distribution_links ?? null })) as SongSummary[]}
            initialQuotes={quotes.map(q => ({ ...q, display_until: serializeDate(q.display_until), createdAt: serializeDate(q.createdAt) })) as QuoteSummary[]}
            initialGraffiti={graffiti.map(g => ({ ...g, display_until: serializeDate(g.display_until), createdAt: serializeDate(g.createdAt) })) as GraffitiSummary[]}
            initialCompetitions={competitions.map(c => ({
                ...c,
                startDate: serializeDate(c.startDate) ?? new Date().toISOString(),
                endDate: serializeDate(c.endDate) ?? new Date().toISOString(),
                submissionDeadline: serializeDate(c.submissionDeadline) ?? new Date().toISOString(),
                createdAt: serializeDate(c.createdAt) ?? new Date().toISOString(),
                updatedAt: serializeDate(c.updatedAt) ?? new Date().toISOString(),
                _count: c._count ? {
                    subscribers: c._count.subscribers,
                    submissions: c._count.submissions,
                } : undefined,
            })) as CompetitionSummary[]}
            initialSubmissions={submissions.map(s => ({
                ...s,
                createdAt: serializeDate(s.createdAt) ?? new Date().toISOString(),
                updatedAt: serializeDate(s.updatedAt) ?? new Date().toISOString(),
                competition: s.competition ? { id: s.competition.id, title: s.competition.title } : undefined,
            })) as LyricSubmissionSummary[]}
            initialWinners={winners.map(w => ({
                ...w,
                winningDate: serializeDate(w.winningDate) ?? new Date().toISOString(),
                createdAt: serializeDate(w.createdAt) ?? new Date().toISOString(),
                cashAmount: serializeDecimal(w.cashAmount),
                submission: w.submission ? {
                    artistAlias: w.submission.artistAlias,
                    lyrics: w.submission.lyrics,
                    songTitle: w.submission.songTitle,
                } : undefined,
            })) as WinnerSummary[]}
            initialSubscribers={subscribers.map(s => ({
                ...s,
                consentTimestamp: serializeDate(s.consentTimestamp) ?? new Date().toISOString(),
                unsubscribedAt: serializeDate(s.unsubscribedAt),
                lastEmailSentAt: serializeDate(s.lastEmailSentAt),
                createdAt: serializeDate(s.createdAt) ?? new Date().toISOString(),
                updatedAt: serializeDate(s.updatedAt) ?? new Date().toISOString(),
                competition: s.competition ? { title: s.competition.title } : undefined,
            })) as SubscriberSummary[]}
            initialUsers={usersWithData}
        />
    );
}
