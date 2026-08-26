import { memo } from 'react';
import { StampBadge } from '../../../shared/components/StampBadge';
import { daysBetween, formatDateNoYear } from '../../../shared/lib/dateFormat';
import type { Stay } from '../types';
import styles from './StayCard.module.css';

function StayCardComponent({ stay, onOpen, overlapping }: { stay: Stay; onOpen: (stay: Stay) => void; overlapping: boolean }) {
  const nights = daysBetween(stay.checkinDate, stay.checkoutDate);
  const nightsLabel = nights === 1 ? '1 νύχτα' : `${nights} νύχτες`;

  return (
    <div className={styles.card} onClick={() => onOpen(stay)}>
      <div className={styles.topRow}>
        <div>
          <div className={styles.name}>{stay.name}</div>
          <div className={styles.address}>{stay.address}</div>
        </div>
        {nights > 0 && <StampBadge tone="teal">{nightsLabel}</StampBadge>}
      </div>
      <div className={styles.divider} />
      <div className={styles.grid}>
        <div>
          <div className={styles.label}>Check-in</div>
          <div className={styles.value}>
            {formatDateNoYear(stay.checkinDate)} · {stay.checkinTime}
          </div>
        </div>
        <div className={styles.gridColRight}>
          <div className={styles.label}>Check-out</div>
          <div className={styles.value}>
            {formatDateNoYear(stay.checkoutDate)} · {stay.checkoutTime}
          </div>
        </div>
      </div>
      {stay.bookingRef && (
        <>
          <div className={styles.divider} />
          <div className={styles.bookingRef}>
            <span className={styles.label}>Κωδ.</span> {stay.bookingRef}
          </div>
        </>
      )}
      {overlapping && (
        <div className={styles.warning}>
          <span aria-hidden="true">⚠</span> Επικάλυψη με άλλη διαμονή σε αυτές τις νύχτες. Επιτρέπεται — έλεγξέ το.
        </div>
      )}
    </div>
  );
}

export const StayCard = memo(StayCardComponent);
