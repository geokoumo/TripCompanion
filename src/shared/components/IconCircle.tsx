import type { ReactNode } from 'react';
import styles from './IconCircle.module.css';

export type IconTone = 'rust' | 'teal' | 'brass' | 'purple' | 'gray';

interface IconCircleProps {
  tone: IconTone;
  size?: number;
  children: ReactNode;
}

/** A colored circle badge behind a type/category icon — the "Add to trip" picker, booking-item lists, and Documents all use this same shape. */
export function IconCircle({ tone, size = 40, children }: IconCircleProps) {
  return (
    <span className={styles.circle} data-tone={tone} style={{ width: size, height: size }}>
      {children}
    </span>
  );
}
