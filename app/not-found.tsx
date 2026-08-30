import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Page Not Found',
};

export default function NotFound() {
    return (
        <section className="section notfound-section">
            <div className="container" style={{ textAlign: 'center', paddingTop: '120px', paddingBottom: '120px' }}>
                <div className="section-badge">404</div>
                <h1 className="notfound-title">This Track Doesn&apos;t Exist</h1>
                <p className="notfound-copy">
                    The page you&apos;re looking for was moved, deleted, or never dropped. Head back home and keep the vibe going.
                </p>
                <div className="notfound-actions">
                    <Link href="/" className="btn-badge glass-button link-btn">🏠 Back Home</Link>
                    <Link href="/library" className="btn-badge glass-button link-btn">🎵 Music Library</Link>
                </div>
            </div>
        </section>
    );
}
