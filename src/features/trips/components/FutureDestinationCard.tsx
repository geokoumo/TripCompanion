import { destinationLabel } from '../lib/summary';
import { useCoverPhotoUrl } from '../lib/useCoverPhotoUrl';
import type { TripListItem } from '../types';
import styles from './FutureDestinationCard.module.css';

interface FutureDestinationCardProps {
  trip: TripListItem;
  onOpen: () => void;
}

/** "Month Year" — parsed as UTC so this never shifts a day near midnight relative to the plain YYYY-MM-DD dates stored everywhere else. */
function monthYearLabel(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Editorial teaser card for Home's "Future Destinations" row — photo + month/year + name, no status pill or menu (that's TripCard's job on the Trips list). */
export function FutureDestinationCard({ trip, onOpen }: FutureDestinationCardProps) {
  const photoUrl = useCoverPhotoUrl(trip.coverPhotoPath);
  const dest = destinationLabel(trip.cities) || trip.title;

  return (
    <button type="button" className={styles.card} onClick={onOpen}>
      <div className={styles.photoWrap} style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined}>
        {!photoUrl && <div className={styles.photoPlaceholder} aria-hidden="true" />}
        <div className={styles.overlay} />
        <div className={styles.textStack}>
          {trip.startDate && <div className={styles.date}>{monthYearLabel(trip.startDate).toUpperCase()}</div>}
          <div className={styles.name}>{dest}</div>
        </div>
      </div>
    </button>
  );
}
