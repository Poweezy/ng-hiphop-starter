'use client';

import { useEffect, useRef } from 'react';

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

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

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
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    // Focus the confirm button on open.
    confirmButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key !== 'Tab' || !dialog.contains(document.activeElement)) return;

      const focusableEls = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusableEls.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

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
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
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
          id="confirm-dialog-title"
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
          id="confirm-dialog-message"
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
            ref={cancelButtonRef}
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
            ref={confirmButtonRef}
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
