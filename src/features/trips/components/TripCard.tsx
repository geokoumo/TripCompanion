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

  const dest = destinationLabel(trip.legs);
  const subtitle = range ? `${formatDateShort(range.startDate)} – ${formatDateShort(range.endDate)}${dest ? ` · ${dest}` : ''}` : dest;

  return (
    <div className={styles.card} onClick={onOpen}>
      <div className={styles.topRow}>
        <span className={styles.title}>{trip.title}</span>
        <StampBadge tone={tone}>{statusStampLabel(trip)}</StampBadge>
      </div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      <div className={styles.footerRow}>
        <AvatarRow travelers={trip.travelers} />
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
      </div>
    </div>
  );
}
