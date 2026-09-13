'use client';

import { useCallback, useState } from 'react';
import styles from './Toast.module.css';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

let toastCounter = 0;

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastMessage['type'], text: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${toast.type === 'success' ? styles.success : styles.error}`}
          onClick={() => onDismiss(toast.id)}
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
}
