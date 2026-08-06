export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={`loading-spinner loading-spinner--${size}`}>
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
    <div className="loading-overlay">
      <LoadingSpinner size="lg" />
      <p className="loading-overlay-text">{message}</p>
    </div>
  );
}
