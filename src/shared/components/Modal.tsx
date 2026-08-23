import type { ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ title, onClose, children, footer }: ModalProps) {
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.handle} />
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Κλείσιμο">
            ✕
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
