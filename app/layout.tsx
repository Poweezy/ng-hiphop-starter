import type { Metadata } from 'next';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';
import SplashScreenWrapper from '@/components/SplashScreenWrapper';
import ConsentAwareAnalytics from '@/components/ConsentAwareAnalytics';

export const metadata: Metadata = {
    title: {
        default: 'NG — Built From Bars. Raised By Beats.',
        template: '%s | NG Hip Hop'
    },
    icons: {
        icon: '/images/logo.png'
    },
    description: 'The official platform for NG. Authentic hip-hop, community-driven, and legally distributed. Stream the latest releases and join the movement.',
    keywords: ['NG Hip Hop', 'Eswatini Music', 'African Rap', 'Urban Culture', 'Music Platform'],
    authors: [{ name: 'NG Team' }],
    creator: 'NG Hip Hop',
    publisher: 'NG Music',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL('https://ng-hiphop.com'),
    openGraph: {
        title: 'NG — Authentic Hip-Hop Platform',
        description: 'Built From Bars. Raised By Beats. Experience the sound of the streets.',
        url: 'https://ng-hiphop.com',
        siteName: 'NG Hip Hop',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'NG Hip Hop Platform',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'NG — Built From Bars. Raised By Beats.',
        description: 'Authentic hip-hop, community-driven, and legally distributed.',
        creator: '@nghiphop',
        images: ['/twitter-image.jpg'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/images/logo.png" />
            </head>
            <body>
                <SplashScreenWrapper />
                <LayoutWrapper>{children}</LayoutWrapper>
                <ConsentAwareAnalytics />
            </body>
        </html>
    );
}
