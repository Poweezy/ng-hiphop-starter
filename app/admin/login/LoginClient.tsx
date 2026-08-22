'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';

import Image from 'next/image';
import Link from 'next/link';
import PasswordStrength from '@/components/PasswordStrength';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  ariaInvalid?: boolean;
  ariaDescribedby?: string;
  required?: boolean;
}

function PasswordField({ id, label, value, onChange, placeholder, autoComplete, disabled, ariaInvalid, ariaDescribedby, required = true }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label admin-login-label">{label}</label>
      <div className="password-field-wrap">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="admin-input password-field-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedby}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="password-toggle"
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
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="admin-login-logo-wrap">
            <Image
              src="/images/logo.png"
              alt="Nerd Gauge Logo"
              width={90}
              height={90}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div className="admin-login-portal">
            ADMIN PORTAL
          </div>
          <Link href="/" className="admin-login-back">
            ← Back to Home
          </Link>
        </div>

        <div className="admin-login-form-card">
          {nextAuthError && (
            <div className="error-alert" role="alert">
              {getNextAuthErrorMessage(nextAuthError)}
            </div>
          )}

          {!forgotPassword ? (
            <form onSubmit={handleLogin} className="admin-login-form" aria-live="polite">
              <div className="form-group">
                <label htmlFor="admin-email" className="form-label admin-login-label">Email</label>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
                className="admin-login-link"
              >
                Forgot Password?
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="admin-login-form" aria-live="polite">
              <div className="form-group">
                <label htmlFor="reset-email" className="form-label admin-login-label">Admin Email</label>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetSecret(e.target.value)}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                disabled={loading}
                ariaInvalid={!!error}
                ariaDescribedby={error ? 'reset-error' : undefined}
              />
              <PasswordStrength password={password} />

              {error && <div id="reset-error" className="error-alert" role="alert">{error}</div>}
              {success && (
                <div className="admin-success-box" role="status">
                  ✅ {success}
                </div>
              )}

              <button type="submit" className="btn-admin-purple" disabled={loading}>
                {loading ? 'Processing...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => { setForgotPassword(false); setError(''); setSuccess(''); setNextAuthError(null); }}
                className="admin-login-link"
              >
                ← Back to Login
              </button>
            </form>
          )}
        </div>

        <p className="admin-login-footer">
          Authorized access only · NG Platform {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
