import { AvatarRow } from '../../../shared/components/AvatarChip';
import { Menu } from '../../../shared/components/Menu';
import { StampBadge } from '../../../shared/components/StampBadge';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { countdownLabel, destinationLabel } from '../lib/summary';
import { getTripStatus, type Trip } from '../types';
import styles from './TripCard.module.css';

interface TripCardProps {
  trip: Trip;
  onOpen: () => void;
  onArchiveToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function TripCard({ trip, onOpen, onArchiveToggle, onDuplicate, onDelete }: TripCardProps) {
  const status = getTripStatus(trip);
  const tone = status === 'ongoing' ? 'teal' : status === 'completed' ? 'gray' : 'rust';

  return (
    <div className={styles.card} onClick={onOpen}>
      <div className={styles.topRow}>
        <span className={styles.title}>{trip.title}</span>
        <span className={styles.badgeRow}>
          <StampBadge tone={tone}>{countdownLabel(trip)}</StampBadge>
          <Menu
            items={[
              { label: trip.archived ? 'Επαναφορά' : 'Αρχειοθέτηση', onSelect: onArchiveToggle },
              { label: 'Διπλασιασμός', onSelect: onDuplicate },
              { label: 'Διαγραφή', onSelect: onDelete, danger: true },
            ]}
          />
        </span>
      </div>
      <div className={styles.dates}>
        {formatDateShort(trip.startDate)} – {formatDateShort(trip.endDate)}
      </div>
      <div className={styles.destRow}>
        <span className={styles.destLabel}>{destinationLabel(trip.legs)}</span>
        <AvatarRow travelers={trip.travelers} />
      </div>
    </div>
  );
}
