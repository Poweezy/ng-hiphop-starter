import type { Metadata } from 'next';
import { Bebas_Neue, Inter, Barlow_Condensed, Dancing_Script } from 'next/font/google';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';
import SplashScreenWrapper from '@/components/SplashScreenWrapper';
import ConsentAwareAnalytics from '@/components/ConsentAwareAnalytics';
import { SessionProvider } from 'next-auth/react';
import { AudioProvider } from '@/lib/audioContext';

const bebasNeue = Bebas_Neue({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-bebas',
    display: 'swap',
});

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const barlowCondensed = Barlow_Condensed({
    weight: ['400', '600', '700', '900'],
    subsets: ['latin'],
    variable: '--font-barlow',
    display: 'swap',
});

const dancingScript = Dancing_Script({
    weight: '700',
    subsets: ['latin'],
    variable: '--font-dancing',
    display: 'swap',
});

export const metadata: Metadata = {
    title: {
        default: 'NG — Built From Bars. Raised By Beats.',
        template: '%s | NG Hip Hop'
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/images/apple-touch-icon.png',
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
    alternates: {
        canonical: '/',
    },
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
        <html lang="en" className={`${bebasNeue.variable} ${inter.variable} ${barlowCondensed.variable} ${dancingScript.variable}`}>
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
            </head>
            <body>
                <SessionProvider>
                    <AudioProvider>
                        <SplashScreenWrapper />
                        <LayoutWrapper>{children}</LayoutWrapper>
                        <ConsentAwareAnalytics />
                    </AudioProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
