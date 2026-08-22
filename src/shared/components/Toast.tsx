import styles from './Toast.module.css';

export interface ToastMessage {
  id: string;
  text: string;
  variant?: 'info' | 'success' | 'error';
}

export function ToastStack({ toasts }: { toasts: ToastMessage[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className={styles.stack} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={styles.toast} data-variant={toast.variant ?? 'info'}>
          {toast.text}
        </div>
      ))}
    </div>
  );
}
