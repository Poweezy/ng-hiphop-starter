'use client';

import { useState } from 'react';
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

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [resetSecret, setResetSecret] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [forgotPassword, setForgotPassword] = useState(false);

     const handleLogin = async (e: React.FormEvent) => {
         e.preventDefault();
         setLoading(true);
         setError('');

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

        try {
            const res = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, resetSecret, newPassword: password }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Reset failed');

            setSuccess('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                setForgotPassword(false);
                setSuccess('');
                setPassword('');
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
                                onClick={() => { setForgotPassword(true); setError(''); }}
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
                                onClick={() => { setForgotPassword(false); setError(''); setSuccess(''); }}
                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '10px' }}
                            >
                                ← Back to Login
                            </button>
                        </form>
                    )}
                </div>

                <style jsx>{`
                    .admin-input {
                        width: 100%;
                        padding: 12px 16px;
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 8px;
                        color: white;
                        outline: none;
                        transition: all 0.2s;
                    }
                    .admin-input:focus {
                        border-color: #047857;
                        background: rgba(4, 120, 87, 0.05);
                    }
                    .error-alert {
                        padding: 12px;
                        background: rgba(220,38,38,0.1);
                        border: 1px solid #ef4444;
                        color: #f87171;
                        border-radius: 6px;
                        font-size: 0.85rem;
                    }
                    .btn-admin {
                        background: #059669;
                        color: white;
                        border: none;
                        padding: 14px;
                        border-radius: 8px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .btn-admin:hover {
                        background: #047857;
                        transform: translateY(-1px);
                    }
                    .btn-admin-purple {
                        background: #7c3aed;
                        color: white;
                        border: none;
                        padding: 14px;
                        border-radius: 8px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .btn-admin-purple:hover {
                        background: #6d28d9;
                        transform: translateY(-1px);
                    }
                `}</style>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', marginTop: '20px' }}>
                    Authorized access only · NG Platform {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
