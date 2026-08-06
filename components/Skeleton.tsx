export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-text" style={{ height: '20px', marginBottom: '12px', width: '60%' }} />
      <div className="skeleton-text" style={{ height: '16px', marginBottom: '8px' }} />
      <div className="skeleton-text" style={{ height: '16px', width: '80%' }} />
    </div>
  );
}

export function SkeletonImage({ aspectRatio = '1/1' }: { aspectRatio?: string }) {
  return <div className="skeleton-image" style={{ aspectRatio }} />;
}

export function SkeletonText({ width = '100%', height = '16px' }: { width?: string; height?: string }) {
  return <div className="skeleton-text" style={{ height, width }} />;
}
