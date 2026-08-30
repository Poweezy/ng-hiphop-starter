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
            <style jsx>{`
                .notfound-title {
                    font-family: var(--font-display);
                    font-size: clamp(2rem, 6vw, 3.5rem);
                    color: white;
                    margin: 16px 0;
                }
                .notfound-copy {
                    color: rgba(255, 255, 255, 0.65);
                    max-width: 460px;
                    margin: 0 auto 32px;
                    line-height: 1.6;
                }
                .notfound-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
            `}</style>
        </section>
    );
}
