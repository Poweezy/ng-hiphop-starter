import { prisma } from '@/app/db';
import type { Song } from '@prisma/client';
import type { Metadata } from 'next';
import MusicLibrary from '@/components/MusicLibrary';

// Revalidate every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
    title: 'Music Library | NG Hip Hop',
    description: 'Stream all NG Hip Hop releases, from the classics to the latest drops. Explore the full discography of authentic Eswatini rap, hip-hop, and urban culture.',
    openGraph: {
        title: 'Music Library — NG Hip Hop',
        description: 'Stream all releases, from the classics to the latest drops.',
        url: 'https://ng-hiphop.com/library',
        siteName: 'NG Hip Hop',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'NG Hip Hop Music Library',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
};

export default async function LibraryPage() {
    let songs: Song[] = [];
    try {
        songs = await prisma.song.findMany({
            where: { is_active: true },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    } catch {
        // Database unavailable during build or runtime — render empty library
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'NG Hip Hop Music Library',
        description: 'Full discography of active NG Hip Hop releases',
        url: 'https://ng-hiphop.com/library',
        numberOfItems: songs.length,
        itemListElement: songs.map((song, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: song.title,
            url: `https://ng-hiphop.com/library#song-${song.id}`,
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <MusicLibrary songs={songs} />
        </>
    );
}
