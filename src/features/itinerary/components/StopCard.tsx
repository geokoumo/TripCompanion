import { memo } from 'react';
import { ITINERARY_STOP_TYPES } from '../../../config/constants';
import type { Traveler } from '../../travelers/types';
import type { ItineraryStop } from '../types';
import styles from './StopCard.module.css';

interface StopCardProps {
  stop: ItineraryStop;
  travelers: Traveler[];
  onOpen: (stop: ItineraryStop) => void;
}

function StopCardComponent({ stop, travelers, onOpen }: StopCardProps) {
  const type = ITINERARY_STOP_TYPES.find((t) => t.id === stop.type);
  const travelerLabel = stop.travelerIds.length === 0 ? 'όλοι' : travelers.filter((t) => stop.travelerIds.includes(t.id)).map((t) => t.name).join(', ');
  const durationLabel = stop.durationMinutes ? `${Math.round(stop.durationMinutes / 60) > 0 ? `${Math.floor(stop.durationMinutes / 60)}ω ` : ''}${stop.durationMinutes % 60}λ` : null;

  return (
    <div className={styles.card} onClick={() => onOpen(stop)}>
      <div className={styles.topRow}>
        <span className={styles.time}>{stop.allDay ? 'Όλη μέρα' : stop.time}</span>
        <span className={styles.badges}>
          <span className={styles.typeBadge}>{type?.letter}</span>
        </span>
      </div>
      <div className={styles.title}>{stop.title}</div>
      <div className={styles.meta}>
        {stop.location && `${stop.location} · `}
        {travelerLabel}
        {durationLabel && ` · ${durationLabel}`}
      </div>
    </div>
  );
}

export const StopCard = memo(StopCardComponent);
