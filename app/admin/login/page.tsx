import type { Metadata } from 'next';
import LoginClient from './LoginClient';

// The login page must render per-request so middleware can inject a CSP nonce
// into Next's bootstrap scripts (strict nonce CSP is scoped to /admin routes).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Admin Login',
    description: 'Admin portal login for NG Hip Hop platform.',
    robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
    return <LoginClient />;
}
