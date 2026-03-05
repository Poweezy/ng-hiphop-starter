export function SkeletonCard() {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '24px',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    >
      <div style={{ height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '12px', width: '60%' }} />
      <div style={{ height: '16px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', marginBottom: '8px' }} />
      <div style={{ height: '16px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', width: '80%' }} />
    </div>
  );
}

export function SkeletonImage({ aspectRatio = '1/1' }: { aspectRatio?: string }) {
  return (
    <div
      style={{
        aspectRatio,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
        backgroundSize: '200% 100%',
        borderRadius: '8px',
        animation: 'shimmer 2s infinite',
      }}
    />
  );
}

export function SkeletonText({ width = '100%', height = '16px' }: { width?: string; height?: string }) {
  return (
    <div
      style={{
        height,
        width,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '4px',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    />
  );
}
