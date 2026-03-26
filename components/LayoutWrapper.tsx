'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    return (
        <>
            {!isAdmin && <Navigation />}
            <main>{children}</main>
            {!isAdmin && (
                <footer className="disclaimer-footer" role="contentinfo" aria-label="Legal disclaimer">
                    ⚖️ All content published on this platform is licensed, owned, and legally distributed.
                    Unauthorized use is prohibited.
                </footer>
            )}
        </>
    );
}
