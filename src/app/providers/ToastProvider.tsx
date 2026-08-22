import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { ToastStack, type ToastMessage } from '../../shared/components/Toast';
import { generateId } from '../../shared/lib/id';

interface ToastContextValue {
  showToast: (text: string, variant?: ToastMessage['variant']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const showToast = useCallback((text: string, variant: ToastMessage['variant'] = 'info') => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, text, variant }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, 3200);
    timers.current.set(id, timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastStack toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
