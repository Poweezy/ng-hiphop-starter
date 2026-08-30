// Server-safe: all styles live in globals.css (styled-jsx cannot be used in
// Server Components — it would break the production build).
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <div className={`loading-spinner loading-spinner--${size}`} />;
}

export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="loading-overlay">
      <LoadingSpinner size="lg" />
      <p className="loading-overlay-text">{message}</p>
    </div>
  );
}
