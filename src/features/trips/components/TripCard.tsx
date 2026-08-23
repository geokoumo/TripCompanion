import { AvatarRow } from '../../../shared/components/AvatarChip';
import { StampBadge } from '../../../shared/components/StampBadge';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { destinationLabel, statusStampLabel } from '../lib/summary';
import { getTripDateRange } from '../lib/dateRange';
import { getTripStatus, type Trip } from '../types';
import styles from './TripCard.module.css';

interface TripCardProps {
  trip: Trip;
  onOpen: () => void;
  onOpenMenu: () => void;
}

export function TripCard({ trip, onOpen, onOpenMenu }: TripCardProps) {
  const range = getTripDateRange(trip.legs, trip.flights);
  const status = trip.archived ? 'completed' : getTripStatus(range);
  const tone = trip.archived ? 'gray' : status === 'ongoing' || status === 'today' ? 'teal' : status === 'completed' ? 'gray' : 'rust';

  return (
    <div className={styles.card} onClick={onOpen}>
      <div className={styles.topRow}>
        <span className={styles.title}>{trip.title}</span>
        <span className={styles.badgeRow}>
          <StampBadge tone={tone}>{statusStampLabel(trip)}</StampBadge>
          <button
            type="button"
            className={styles.menuButton}
            onClick={(e) => {
              e.stopPropagation();
              onOpenMenu();
            }}
            aria-label="Περισσότερα"
          >
            ···
          </button>
        </span>
      </div>
      {range && (
        <div className={styles.dates}>
          {formatDateShort(range.startDate)} – {formatDateShort(range.endDate)}
        </div>
      )}
      <div className={styles.destRow}>
        <span className={styles.destLabel}>{destinationLabel(trip.legs)}</span>
        <AvatarRow travelers={trip.travelers} />
      </div>
    </div>
  );
}
