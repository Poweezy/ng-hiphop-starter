interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 'clamp(40px, 8vw, 80px) 20px',
        background: 'rgba(17, 24, 39, 0.4)',
        border: '2px dashed rgba(139, 92, 246, 0.3)',
        borderRadius: '20px',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          fontSize: 'clamp(3rem, 8vw, 5rem)',
          marginBottom: '20px',
          opacity: 0.6,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          marginBottom: '12px',
          color: 'rgba(255, 255, 255, 0.9)',
          letterSpacing: '0.05em',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: 'var(--color-grey-blue)',
          fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
          maxWidth: '400px',
          margin: '0 auto 28px',
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary"
          style={{ margin: '0 auto' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
