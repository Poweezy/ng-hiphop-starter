import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'NG — Built From Bars. Raised By Beats.',
    description:
        'Official platform for NG. Authentic hip-hop, community-driven, licensed & distributed. Stream, discover, and connect.',
    keywords: ['NG', 'hip-hop', 'rap', 'music', 'artist', 'urban', 'street'],
    openGraph: {
        title: 'NG Hip Hop Platform',
        description: 'Built From Bars. Raised By Beats.',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <main>{children}</main>

                {/* Permanent Legal Disclaimer – Sticky Footer */}
                <footer className="disclaimer-footer" role="contentinfo" aria-label="Legal disclaimer">
                    ⚖️ All content published on this platform is licensed, owned, and legally distributed.
                    Unauthorized use is prohibited.
                </footer>
            </body>
        </html>
    );
}
