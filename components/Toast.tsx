'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10B981', text: '#34D399' },
    error: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#F87171' },
    info: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3B82F6', text: '#60A5FA' }
  };

  const style = colors[type];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '12px',
        padding: '16px 24px',
        color: style.text,
        fontFamily: 'var(--font-condensed)',
        fontSize: '0.95rem',
        fontWeight: 600,
        letterSpacing: '0.05em',
        backdropFilter: 'blur(16px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${style.border}40`,
        zIndex: 9999,
        animation: 'toastSlideIn 0.3s ease, toastFadeOut 0.3s ease 2.7s forwards',
        maxWidth: '400px'
      }}
    >
      {message}
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toastFadeOut {
          to { opacity: 0; transform: translateY(10px); }
        }
      `}</style>
    </div>
  );
}
