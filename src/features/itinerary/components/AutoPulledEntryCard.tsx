import { describeCard } from '../../../shared/lib/accessibleLabel';
import type { AutoPulledEntry } from '../types';
import styles from './AutoPulledEntryCard.module.css';

interface AutoPulledEntryCardProps {
  entry: AutoPulledEntry;
  /** The source flight/stay's own booking reference, when it has one — never invented (see autoPulledEntryMeta). */
  meta?: string;
  /** Opens the source Flight/Stay's own read-only detail view — the same entity its own tab edits, reached from a second place. Omit to render the card non-interactively. */
  onOpen?: (entry: AutoPulledEntry) => void;
}

/**
 * A flight/stay projected onto the itinerary timeline — always a read-only
 * checkpoint, never an editable itinerary item in its own right. Visually
 * distinct from a manually-planned StopCard (teal outline + "FROM YOUR
 * BOOKING" eyebrow) so the timeline reads at a glance which entries are
 * sourced elsewhere versus planned directly.
 */
export function AutoPulledEntryCard({ entry, meta, onOpen }: AutoPulledEntryCardProps) {
  const content = (
    <>
      <div className={styles.eyebrow}>FROM YOUR BOOKING</div>
      <div className={styles.title}>{entry.title}</div>
      <div className={styles.metaRow}>
        <span>{entry.time}</span>
        {meta && <span>{meta}</span>}
      </div>
    </>
  );

  if (onOpen) {
    return (
      <button type="button" className={styles.card} onClick={() => onOpen(entry)} aria-label={describeCard(`Open ${entry.title}`, entry.time, meta)}>
        {content}
      </button>
    );
  }

  return (
    <div className={styles.card} role="group" aria-label={entry.title}>
      {content}
    </div>
  );
}
