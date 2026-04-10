import { prisma } from '@/app/db';
import MusicLibrary from '@/components/MusicLibrary';

// Revalidate every 60 seconds
export const revalidate = 60;

export const metadata = {
    title: 'Music Library | NG Hip-Hop Platform',
    description: 'Stream all our releases, from the classics to the latest drops.',
};

export default async function LibraryPage() {
    const songs = await prisma.song.findMany({
        where: { is_active: true },
        orderBy: { createdAt: 'desc' },
    });

    return <MusicLibrary songs={songs} />;
}
