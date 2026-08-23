import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { ToastStack, type ToastMessage } from '../../shared/components/Toast';
import { generateId } from '../../shared/lib/id';

interface ShowToastOptions {
  variant?: ToastMessage['variant'];
  action?: { label: string; onClick: () => void };
  durationMs?: number;
}

const DEFAULT_DURATIONS: Record<ToastMessage['variant'], number> = {
  error: 6000,
  warn: 5000,
  neutral: 5000,
};

interface ToastContextValue {
  showToast: (text: string, options?: ShowToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (text: string, options: ShowToastOptions = {}) => {
      const variant = options.variant ?? 'neutral';
      const id = generateId();
      setToasts((prev) => [...prev, { id, text, variant, action: options.action }]);
      const duration = options.durationMs ?? DEFAULT_DURATIONS[variant];
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastStack toasts={toasts} onAction={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
