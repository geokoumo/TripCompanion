import type { ReactNode } from 'react';
import { Button } from './Button';
import styles from './WarningCard.module.css';

interface WarningCardProps {
  title: string;
  description: string;
  /** Omit for a warning with no available fix yet — never render a button that goes nowhere real. */
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

/** A single actionable warning — Trip Health's active-warnings list, and anywhere else a deterministic problem needs a title, an explanation, and a real fix. */
export function WarningCard({ title, description, actionLabel, onAction, children }: WarningCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.titleRow}>
        <span className={styles.icon} role="img" aria-label="Warning">
          ⚠
        </span>
        <span>{title}</span>
      </div>
      <p className={styles.description}>{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
