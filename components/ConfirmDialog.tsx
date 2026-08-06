'use client';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
  disabled?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  disabled = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--color-bg-card)',
          border: `2px solid ${variant === 'danger' ? 'rgba(220,38,38,0.5)' : 'rgba(250,204,21,0.5)'}`,
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '480px',
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            marginBottom: '12px',
            color: variant === 'danger' ? '#F87171' : 'var(--color-yellow)',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '28px',
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 24px',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontFamily: 'var(--font-condensed)',
              fontSize: '0.9rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            style={{
              padding: '10px 24px',
              borderRadius: '4px',
              border: 'none',
              background: variant === 'danger' ? '#DC2626' : 'var(--color-yellow)',
              color: variant === 'danger' ? 'white' : 'var(--color-black)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              fontFamily: 'var(--font-condensed)',
              fontSize: '0.9rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
