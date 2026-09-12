import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: ReactNode;
  /** Omit for a top-level screen with no "back" concept (e.g. Home). */
  onBack?: () => void;
  backLabel?: string;
  /** e.g. a settings gear button — the one slot every screen header actually varies on. */
  trailing?: ReactNode;
}

/** The back-button + title (+ optional trailing action) header shared by full-screen views that aren't a Modal — Trip Health, and any future screen with the same shape. */
export function PageHeader({ title, onBack, backLabel = 'Back', trailing }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      {onBack && (
        <button type="button" className={styles.backButton} onClick={onBack} aria-label={backLabel}>
          ‹
        </button>
      )}
      <span className={styles.title}>{title}</span>
      {trailing && <div className={styles.trailing}>{trailing}</div>}
    </div>
  );
}
