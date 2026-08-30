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
        default: 'Nerd Gauge — Built From Bars. Raised By Beats.',
        template: '%s | Nerd Gauge'
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/images/apple-touch-icon.png',
    },
    description: 'The official platform for Nerd Gauge. Authentic hip-hop, community-driven, and legally distributed. Stream the latest releases and join the movement.',
    keywords: ['Nerd Gauge', 'NG Hip Hop', 'Eswatini Music', 'African Rap', 'Urban Culture', 'Music Platform'],
    authors: [{ name: 'Nerd Gauge' }],
    creator: 'Nerd Gauge',
    publisher: 'Nerd Gauge',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL('https://ng-hiphop.com'),
    openGraph: {
        title: 'Nerd Gauge — Authentic Hip-Hop Platform',
        description: 'Built From Bars. Raised By Beats. Experience the sound of the streets.',
        url: 'https://ng-hiphop.com',
        siteName: 'Nerd Gauge',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Nerd Gauge Platform',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Nerd Gauge — Built From Bars. Raised By Beats.',
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

// Brand + site structured data. NOTE: no `alternates.canonical` here on purpose —
// a layout-level canonical is inherited by every page and would mark them all
// duplicates of the homepage. Each page declares its own canonical instead.
const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: 'Nerd Gauge',
    alternateName: ['NG', 'NG Hip Hop'],
    url: 'https://ng-hiphop.com',
    logo: 'https://ng-hiphop.com/images/logo.png',
    sameAs: ['https://x.com/nghiphop'],
    genre: 'Hip Hop',
};

const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Nerd Gauge',
    alternateName: 'NG Hip Hop',
    url: 'https://ng-hiphop.com',
    publisher: { '@type': 'MusicGroup', name: 'Nerd Gauge' },
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
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
                />
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
