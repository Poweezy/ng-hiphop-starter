import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { prisma } from '@/app/db';

export default async function AdminPage() {
    const session = await getServerSession(authOptions);
    const userRole = session?.user && 'role' in session.user ? (session.user as any).role : null;
    
    if (!session || userRole !== 'ADMIN') {
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
            initialSongs={songs}
            initialQuotes={quotes}
            initialGraffiti={graffiti}
            initialLyrics={lyrics}
        />
    );
}
