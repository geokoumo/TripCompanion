import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { StickyActionBar } from './StickyActionBar';
import styles from './Modal.module.css';

interface ModalProps {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Every open Modal instance, outermost first — lets a nested modal (e.g. a date picker opened on top of a form sheet) know it's the one that should respond to Escape/Tab, not whichever opened first. */
const openModals: symbol[] = [];

export function Modal({ title, onClose, children, footer }: ModalProps) {
  useBodyScrollLock();
  const sheetRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(Symbol('modal'));
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const id = idRef.current;
    openModals.push(id);
    return () => {
      const index = openModals.indexOf(id);
      if (index !== -1) openModals.splice(index, 1);
    };
  }, []);

  // Moves focus into the dialog on open, per WAI-ARIA dialog practice —
  // but only if nothing inside already claimed it (a field's own autoFocus
  // should win over this).
  useEffect(() => {
    const sheet = sheetRef.current;
    if (sheet && !sheet.contains(document.activeElement)) {
      sheet.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only the topmost (most recently opened) modal reacts — a nested
      // picker sheet must not leak Escape/Tab handling to the form behind it.
      if (openModals[openModals.length - 1] !== idRef.current) return;

      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') return;
      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusable = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={sheetRef}
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={styles.handle} />
        <div className={styles.header}>
          <span className={styles.title} id={titleId}>
            {title}
          </span>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <StickyActionBar>{footer}</StickyActionBar>}
      </div>
    </div>
  );
}
