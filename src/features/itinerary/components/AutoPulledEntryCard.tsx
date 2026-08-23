import { StampBadge } from '../../../shared/components/StampBadge';
import type { AutoPulledEntry } from '../types';
import styles from './StopCard.module.css';

export function AutoPulledEntryCard({ entry }: { entry: AutoPulledEntry }) {
  return (
    <div className={styles.card} data-tone={entry.source === 'flight' ? 'rust' : 'teal'}>
      <div className={styles.topRow}>
        <span className={styles.time}>{entry.time}</span>
        <StampBadge tone="gray" locked>
          κλειδωμένο
        </StampBadge>
      </div>
      <div className={styles.title}>{entry.title}</div>
    </div>
  );
}
