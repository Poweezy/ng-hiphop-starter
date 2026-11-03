'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { ToastProvider } from '@/components/ToastProvider';
import CookieConsent from '@/components/CookieConsent';
import MiniPlayer from '@/components/MiniPlayer';
import BottomNavigation from '@/components/BottomNavigation';
import { MailIcon } from './icons';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // usePathname is hydration-safe (server and client render identically),
    // so this can be derived synchronously without a mounted gate.
    const isAdmin = pathname?.startsWith('/admin') ?? false;

    return (
        <ToastProvider>
            <a href="#main-content" className="skip-link">Skip to content</a>
            {!isAdmin && <Navigation />}
            <main id="main-content">{children}</main>
            {!isAdmin && <MiniPlayer />}
            {!isAdmin && <BottomNavigation />}
            {/* Legal footer renders on EVERY page, including /admin */}
            <footer className="disclaimer-footer" role="contentinfo" aria-label="Site footer">
                <nav className="footer-nav" aria-label="Footer navigation">
                    <Link href="/">Home</Link>
                    <span className="footer-sep">·</span>
                    <Link href="/library">Library</Link>
                    <span className="footer-sep">·</span>
                    <Link href="/game/best-lyrics">Competitions</Link>
                    <span className="footer-sep">·</span>
                    <Link href="/submissions/status">Submission Status</Link>
                    <span className="footer-sep">·</span>
                    <a href="/privacy">Privacy</a>
                    <span className="footer-sep">·</span>
                    <a href="/terms">Terms</a>
                </nav>
                <div className="footer-social">
                    {process.env.NEXT_PUBLIC_CONTACT_EMAIL && (
                        <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`} aria-label="Email Nerd Gauge">
                            <MailIcon size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />Contact
                        </a>
                    )}
                </div>
                <p className="footer-disclaimer">
                    All content published on this platform is licensed, owned, and legally distributed.
                    Unauthorized use is prohibited.
                </p>
            </footer>
            {/* Reserves space so the fixed mobile bottom nav never occludes the footer */}
            {!isAdmin && <div className="bottom-nav-spacer" aria-hidden="true" />}
            {!isAdmin && <CookieConsent />}
        </ToastProvider>
    );
}
