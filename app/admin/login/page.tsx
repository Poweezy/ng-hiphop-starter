import type { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
    title: 'Admin Login',
    description: 'Admin portal login for NG Hip Hop platform.',
    robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
    return <LoginClient />;
}
