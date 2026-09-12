import type { ReactNode } from 'react';
import styles from './StickyActionBar.module.css';

interface StickyActionBarProps {
  children: ReactNode;
  /** Set for a full-screen (non-modal) view so the bar pins to the viewport bottom while the screen scrolls. Modal's own sheet already keeps its footer pinned as the last flex child, so its usage omits this. */
  pinned?: boolean;
}

/** The one bottom action-bar treatment (border-top + background + padding) shared by every modal footer and any full-screen view with a persistent primary action. */
export function StickyActionBar({ children, pinned = false }: StickyActionBarProps) {
  return (
    <div className={styles.bar} data-pinned={pinned}>
      {children}
    </div>
  );
}
