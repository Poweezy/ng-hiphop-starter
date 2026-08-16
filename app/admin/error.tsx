'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin page error:', error);
    Sentry.captureException(error, {
      tags: { digest: error.digest, segment: 'admin' },
      extra: { message: error.message },
    });
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '40px',
        textAlign: 'center',
        color: '#fff',
        background: '#050508',
      }}
    >
      <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Admin panel error</h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '460px' }}>
        Something went wrong while loading the dashboard. You can try again.
      </p>
      <button
        onClick={reset}
        style={{
          padding: '12px 28px',
          borderRadius: '10px',
          border: '1px solid rgba(139,92,246,0.4)',
          background: 'rgba(139,92,246,0.15)',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '0.95rem',
        }}
      >
        Try again
      </button>
    </div>
  );
}
