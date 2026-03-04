import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { prisma } from '@/app/db';

export default async function AdminPage() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
        redirect('/admin/login');
    }

    // Fetch all admin data in parallel
    const [slogan, songs, quotes, graffiti, lyrics] = await Promise.all([
        prisma.slogan.findUnique({ where: { id: 1 } }),
        prisma.song.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma.quoteSubmission.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma.graffitiSubmission.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma.lyricGame.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    return (
        <AdminDashboard
            initialSlogan={slogan?.text ?? ''}
            initialSongs={songs as any}
            initialQuotes={quotes as any}
            initialGraffiti={graffiti as any}
            initialLyrics={lyrics as any}
        />
    );
}
