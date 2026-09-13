import type { ReactNode } from 'react';
import styles from './DetailView.module.css';

/**
 * Read-only building blocks for a "View Details" sheet — deliberately
 * distinct from Field.tsx's input styling (no borders, no boxes) so a
 * read-only record never looks like an editable form. Shared by every
 * itinerary item's detail view (Flight/Stay/Sight/Booking) instead of each
 * hand-rolling its own row markup.
 */

export function DetailSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className={styles.section}>
      {title && <div className={styles.sectionTitle}>{title}</div>}
      {children}
    </div>
  );
}

/** A single label/value fact, e.g. "Status — Scheduled". Omit rendering it entirely at the call site when the value is missing. */
export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}

/** Same as DetailRow but the value is an external link, opened in a new tab. */
export function DetailLinkRow({ label, href }: { label: string; href: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <a className={`${styles.value} ${styles.link}`} href={href} target="_blank" rel="noopener noreferrer">
        Open ↗
      </a>
    </div>
  );
}

/** A label above a longer block of free text (notes, address) that wouldn't read well crammed onto one line. */
export function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.block}>
      <div className={styles.blockLabel}>{label}</div>
      <div className={styles.blockValue}>{value}</div>
    </div>
  );
}

