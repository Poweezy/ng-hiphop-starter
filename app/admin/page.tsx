import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { prisma } from '@/app/db';
import type { SongSummary, QuoteSummary, GraffitiSummary, LyricSummary } from '@/lib/adminTypes';

export default async function AdminPage() {
    const session = await auth();
    const userRole = session?.user?.role ?? null;
    
    if (!session || userRole !== 'ADMIN') {
        redirect('/admin/login');
    }

    const [slogan, songs, quotes, graffiti, lyrics, users, competitions] = await Promise.all([
        prisma.slogan.findUnique({ where: { id: 1 } }),
        prisma.song.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
        prisma.quoteSubmission.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
        prisma.graffitiSubmission.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
        prisma.lyricGame.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
        prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
        prisma.lyricCompetition.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                _count: {
                    select: {
                        lyrics: true,
                        subscribers: true,
                    },
                },
            },
        }),
    ]);

    const serializeDate = (value: Date | string | null) => {
        if (value instanceof Date) return value.toISOString();
        return value;
    };

    const usersWithData = await Promise.all(
        users.map(async (u) => {
            const [quoteCount, graffitiCount] = await Promise.all([
                prisma.quoteSubmission.count({ where: { submitted_by: u.email } }),
                prisma.graffitiSubmission.count({ where: { artist_name: u.email } }),
            ]);
            return {
                id: u.id,
                email: u.email,
                role: u.role,
                createdAt: serializeDate(u.createdAt) ?? new Date().toISOString(),
                updatedAt: serializeDate(u.updatedAt) ?? new Date().toISOString(),
                submissionCount: quoteCount + graffitiCount,
            };
        })
    );

    return (
        <AdminDashboard
            initialSlogan={slogan?.text ?? ''}
            initialSongs={songs.map(s => ({ ...s, distribution_links: s.distribution_links ?? null })) as SongSummary[]}
            initialQuotes={quotes.map(q => ({ ...q, display_until: serializeDate(q.display_until), createdAt: serializeDate(q.createdAt) })) as QuoteSummary[]}
            initialGraffiti={graffiti.map(g => ({ ...g, display_until: serializeDate(g.display_until), createdAt: serializeDate(g.createdAt) })) as GraffitiSummary[]}
            initialLyrics={lyrics.map(l => ({ ...l, competitionId: (l as any).competitionId ?? null })) as LyricSummary[]}
            initialCompetitions={competitions.map(c => ({
                ...c,
                startDate: serializeDate(c.startDate) ?? new Date().toISOString(),
                endDate: serializeDate(c.endDate) ?? new Date().toISOString(),
                createdAt: serializeDate(c.createdAt) ?? new Date().toISOString(),
                updatedAt: serializeDate(c.updatedAt) ?? new Date().toISOString(),
                _count: c._count,
            }))}
            initialUsers={usersWithData}
        />
    );
}
