import type { ReactNode } from 'react';
import styles from './StampBadge.module.css';

interface StampBadgeProps {
  children: ReactNode;
  tone?: 'rust' | 'teal' | 'gray';
  locked?: boolean;
}

export function StampBadge({ children, tone = 'gray', locked = false }: StampBadgeProps) {
  return (
    <span className={styles.badge} data-tone={tone} data-locked={locked}>
      {children}
    </span>
  );
}
