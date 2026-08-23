import styles from './Toast.module.css';

export interface ToastMessage {
  id: string;
  text: string;
  variant: 'neutral' | 'warn' | 'error';
  action?: { label: string; onClick: () => void };
}

export function ToastStack({ toasts, onAction }: { toasts: ToastMessage[]; onAction: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className={styles.stack} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={styles.toast} data-variant={toast.variant}>
          <span className={styles.dot} />
          <span className={styles.text}>{toast.text}</span>
          {toast.action && (
            <button
              type="button"
              className={styles.action}
              onClick={() => {
                toast.action!.onClick();
                onAction(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
