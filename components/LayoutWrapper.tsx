'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { ToastProvider } from '@/components/ToastProvider';
import CookieConsent from '@/components/CookieConsent';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    return (
        <ToastProvider>
            <a href="#main-content" className="skip-link">Skip to content</a>
            {!isAdmin && <Navigation />}
            <main id="main-content">{children}</main>
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
