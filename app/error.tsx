'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '40px',
        textAlign: 'center',
        color: '#fff',
        background: '#08080c',
      }}
    >
      <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Something went wrong</h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '460px' }}>
        We hit an unexpected error while loading this page. You can try again.
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
