export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: '24px',
    md: '40px',
    lg: '60px',
  };

  return (
    <div
      style={{
        width: sizes[size],
        height: sizes[size],
        border: '3px solid rgba(139, 92, 246, 0.2)',
        borderTop: '3px solid #8B5CF6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    >
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 15, 0.9)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        zIndex: 9999,
      }}
    >
      <LoadingSpinner size="lg" />
      <p
        style={{
          fontFamily: 'var(--font-condensed)',
          fontSize: '1rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        {message}
      </p>
    </div>
  );
}
