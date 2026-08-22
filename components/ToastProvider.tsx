'use client';

import { useEffect } from 'react';
import { useToastStore, type ToastItem } from '@/lib/stores/useToastStore';

export function useToast() {
  const addToast = useToastStore((s) => s.addToast);

  return {
    success: (message: string) => addToast({ message, type: 'success' }),
    error: (message: string) => addToast({ message, type: 'error' }),
    info: (message: string) => addToast({ message, type: 'info' }),
    warning: (message: string) => addToast({ message, type: 'warning' }),
    undo: (message: string, undoLabel: string, onUndo: () => void) => addToast({ message, type: 'info', duration: 8000, undo: { label: undoLabel, onUndo } }),
  };
}

function Toast({ toast, onClose }: { toast: ToastItem; onClose: (id: string) => void }) {
  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = setTimeout(() => onClose(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      className={`toast toast-${toast.type}`}
      role="status"
      aria-live="polite"
      onClick={() => onClose(toast.id)}
    >
      <span className="toast-message">{toast.message}</span>
      {toast.undo && (
        <button
          className="toast-undo"
          onClick={(e) => {
            e.stopPropagation();
            toast.undo!.onUndo();
            onClose(toast.id);
          }}
        >
          {toast.undo.label}
        </button>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToastStore();

  return (
    <>
      {children}
      <div className="toast-stack" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </>
  );
}
