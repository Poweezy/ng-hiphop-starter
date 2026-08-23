'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { ToastProvider } from '@/components/ToastProvider';
import CookieConsent from '@/components/CookieConsent';
import MiniPlayer from '@/components/MiniPlayer';
import BottomNavigation from '@/components/BottomNavigation';

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
            {!isAdmin && (
                <footer className="disclaimer-footer" role="contentinfo" aria-label="Legal disclaimer">
                    ⚖️ All content published on this platform is licensed, owned, and legally distributed.
                    Unauthorized use is prohibited.
                    <span className="footer-links">
                        <a href="/privacy">Privacy</a>
                        <span className="footer-sep">·</span>
                        <a href="/terms">Terms</a>
                    </span>
                </footer>
            )}
            {!isAdmin && <CookieConsent />}
        </ToastProvider>
    );
}
