import type { ReactNode } from 'react';
import styles from './TimelineItem.module.css';

interface TimelineItemProps {
  /** A leading marker — a day-number tile, a type-code badge, an icon circle. Callers own its exact look; this only positions it. */
  marker: ReactNode;
  title: string;
  subtitle?: string;
  /** e.g. a status badge or chevron. */
  trailing?: ReactNode;
  onClick?: () => void;
}

/** One condensed row — a compact itinerary stop, a booking-summary line — for lists too dense for a full Card per item (Overview's command-center sections). */
export function TimelineItem({ marker, title, subtitle, trailing, onClick }: TimelineItemProps) {
  const content = (
    <>
      <span className={styles.marker}>{marker}</span>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </span>
      {trailing && <span className={styles.trailing}>{trailing}</span>}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={styles.row} data-interactive="true" onClick={onClick} aria-label={title}>
        {content}
      </button>
    );
  }

  return <div className={styles.row}>{content}</div>;
}
