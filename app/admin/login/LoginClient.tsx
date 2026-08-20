'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';

import Image from 'next/image';
import PasswordStrength from '@/components/PasswordStrength';

function PasswordField({ id, label, value, onChange, placeholder, autoComplete, disabled, ariaInvalid, ariaDescribedby, required = true }: any) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="form-group">
            <label htmlFor={id} className="form-label" style={{ color: 'var(--color-green-light)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    className="admin-input"
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required={required}
                    autoComplete={autoComplete}
                    disabled={disabled}
                    aria-invalid={ariaInvalid}
                    aria-describedby={ariaDescribedby}
                    style={{ paddingRight: 44 }}
                />
                <button
                    type="button"
                    onClick={() => setVisible(v => !v)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer', fontSize: '0.8rem', padding: '4px 8px'
                    }}
                >
                    {visible ? '🙈' : '👁️'}
                </button>
            </div>
        </div>
    );
}

export default function LoginClient() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetSecret, setResetSecret] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [forgotPassword, setForgotPassword] = useState(false);
    const [nextAuthError, setNextAuthError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const err = params.get('error');
            if (err) {
                setNextAuthError(err);
            }
        }
    }, []);

    const getNextAuthErrorMessage = (errorCode: string): string => {
        switch (errorCode) {
            case 'Configuration':
                return 'Authentication is not properly configured. Please contact the administrator.';
            case 'AccessDenied':
                return 'Access denied. You do not have permission to sign in.';
            case 'Verification':
                return 'The sign-in link is no longer valid. It may have been used already or it may have expired.';
            case 'Default':
            default:
                return 'An authentication error occurred. Please try again.';
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setNextAuthError(null);

        try {
            await signIn('credentials', {
                callbackUrl: '/admin',
                email: email.trim().toLowerCase(),
                password,
            });
        } catch (err) {
            console.error('signIn exception:', err);
            setError('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, resetSecret, newPassword: password, confirmPassword }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Reset failed');

            setSuccess('Password reset successfully! You can now log in.');
            setTimeout(() => {
                setForgotPassword(false);
                setSuccess('');
                setPassword('');
                setConfirmPassword('');
                setResetSecret('');
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
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
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: '12px'
                        }}
                    >
                        <Image
                            src="/images/logo.png"
                            alt="Nerd Gauge Logo"
                            width={90}
                            height={90}
                            style={{ objectFit: 'contain' }}
                            priority
                        />
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

                {/* Login/Reset Form */}
                <div
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
                    {nextAuthError && (
                        <div className="error-alert" role="alert">
                            {getNextAuthErrorMessage(nextAuthError)}
                        </div>
                    )}

                    {!forgotPassword ? (
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} aria-live="polite">
                            <div className="form-group">
                                <label htmlFor="admin-email" className="form-label" style={{ color: 'var(--color-green-light)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Email</label>
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
                                    aria-invalid={!!error}
                                    aria-describedby={error ? 'login-error' : undefined}
                                />
                            </div>

                            <PasswordField
                                id="admin-password"
                                label="Password"
                                value={password}
                                onChange={setPassword}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                disabled={loading}
                                ariaInvalid={!!error}
                                ariaDescribedby={error ? 'login-error' : undefined}
                            />

                            {error && <div id="login-error" className="error-alert" role="alert">{error}</div>}

                            <button type="submit" className="btn-admin" disabled={loading}>
                                {loading ? '⏳ Authenticating...' : '🔐 Access Dashboard'}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setForgotPassword(true); setError(''); setNextAuthError(null); }}
                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '10px' }}
                            >
                                Forgot Password?
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} aria-live="polite">
                            <div className="form-group">
                                <label htmlFor="reset-email" className="form-label" style={{ color: 'var(--color-purple-light)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Admin Email</label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    className="admin-input"
                                    placeholder="Confirm your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    aria-invalid={!!error}
                                    aria-describedby={error ? 'reset-error' : undefined}
                                />
                            </div>

                            <PasswordField
                                id="reset-secret"
                                label="Master Secret Key"
                                value={resetSecret}
                                onChange={setResetSecret}
                                placeholder="Enter reset secret from .env"
                                autoComplete="off"
                                disabled={loading}
                                ariaInvalid={!!error}
                                ariaDescribedby={error ? 'reset-error' : undefined}
                            />

                            <PasswordField
                                id="reset-password"
                                label="New Password"
                                value={password}
                                onChange={setPassword}
                                placeholder="Min 8 characters"
                                autoComplete="new-password"
                                disabled={loading}
                                ariaInvalid={!!error}
                                ariaDescribedby={error ? 'reset-error' : undefined}
                            />
                            <PasswordField
                                id="reset-confirm-password"
                                label="Confirm New Password"
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                placeholder="Re-enter new password"
                                autoComplete="new-password"
                                disabled={loading}
                                ariaInvalid={!!error}
                                ariaDescribedby={error ? 'reset-error' : undefined}
                            />
                            <PasswordStrength password={password} />

                            {error && <div id="reset-error" className="error-alert" role="alert">{error}</div>}
                            {success && (
                                <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '6px', color: '#10b981', fontSize: '0.85rem' }} role="status">
                                    ✅ {success}
                                </div>
                            )}

                            <button type="submit" className="btn-admin-purple" disabled={loading}>
                                {loading ? 'Processing...' : 'Reset Password'}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setForgotPassword(false); setError(''); setSuccess(''); setNextAuthError(null); }}
                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '10px' }}
                            >
                                ← Back to Login
                            </button>
                        </form>
                    )}
                </div>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', marginTop: '20px' }}>
                    Authorized access only · NG Platform {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
