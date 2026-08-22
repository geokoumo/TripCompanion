import { formatDateNoYear } from '../../../shared/lib/dateFormat';
import type { Stay } from '../types';
import styles from './StayCard.module.css';

export function StayCard({ stay, onOpen, overlapping }: { stay: Stay; onOpen: () => void; overlapping: boolean }) {
  return (
    <div className={styles.card} onClick={onOpen}>
      <div className={styles.name}>{stay.name}</div>
      <div className={styles.address}>{stay.address}</div>
      <div className={styles.divider} />
      <div className={styles.grid}>
        <div>
          <div className={styles.label}>Check-in</div>
          <div className={styles.value}>
            {formatDateNoYear(stay.checkinDate)} · {stay.checkinTime}
          </div>
        </div>
        <div>
          <div className={styles.label}>Check-out</div>
          <div className={styles.value}>
            {formatDateNoYear(stay.checkoutDate)} · {stay.checkoutTime}
          </div>
        </div>
      </div>
      {overlapping && <div className={styles.warning}>Επικαλύπτεται με άλλη διαμονή</div>}
    </div>
  );
}
