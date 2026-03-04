'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await signIn('credentials', {
            redirect: false,
            email: email.trim().toLowerCase(),
            password,
        });

        setLoading(false);
        if (result?.error) {
            setError('Invalid credentials. Access denied.');
        } else {
            router.push('/admin');
            router.refresh();
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'var(--color-black)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                fontFamily: 'var(--font-body)',
            }}
        >
            <div style={{ width: '100%', maxWidth: '420px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div
                        style={{
                            fontFamily: 'var(--font-cursive)',
                            fontSize: '3.5rem',
                            background: 'linear-gradient(135deg, #a855f7 0%, #6A0DAD 50%, #3b82f6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            lineHeight: 1,
                        }}
                    >
                        NG
                    </div>
                    <div
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '0.85rem',
                            letterSpacing: '0.3em',
                            color: 'var(--color-grey-blue)',
                            marginTop: '4px',
                        }}
                    >
                        ADMIN PORTAL
                    </div>
                </div>

                {/* Login Form */}
                <form
                    onSubmit={handleSubmit}
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(4,120,87,0.3)',
                        borderRadius: '12px',
                        padding: '36px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                    }}
                >
                    <div className="form-group">
                        <label htmlFor="admin-email" className="form-label" style={{ color: 'var(--color-green-light)' }}>
                            Email
                        </label>
                        <input
                            id="admin-email"
                            type="email"
                            className="admin-input"
                            placeholder="admin@ng.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="admin-password" className="form-label" style={{ color: 'var(--color-green-light)' }}>
                            Password
                        </label>
                        <input
                            id="admin-password"
                            type="password"
                            className="admin-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div
                            role="alert"
                            style={{
                                padding: '12px 16px',
                                background: 'rgba(220,38,38,0.15)',
                                border: '1px solid rgba(220,38,38,0.4)',
                                borderRadius: '6px',
                                color: '#F87171',
                                fontSize: '0.9rem',
                            }}
                        >
                            🚫 {error}
                        </div>
                    )}

                    <button type="submit" className="btn-admin" disabled={loading} style={{ marginTop: '4px' }}>
                        {loading ? '⏳ Authenticating...' : '🔐 Access Dashboard'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', marginTop: '20px' }}>
                    Authorized access only · NG Platform {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
