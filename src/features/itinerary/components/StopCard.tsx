import { memo } from 'react';
import { ITINERARY_STOP_TYPES } from '../../../config/constants';
import { Card } from '../../../shared/components/Card';
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
  const travelerLabel = stop.travelerIds.length === 0 ? 'all' : travelers.filter((t) => stop.travelerIds.includes(t.id)).map((t) => t.name).join(', ');
  const durationLabel = stop.durationMinutes ? `${Math.round(stop.durationMinutes / 60) > 0 ? `${Math.floor(stop.durationMinutes / 60)}h ` : ''}${stop.durationMinutes % 60}m` : null;

  return (
    <Card flat onClick={() => onOpen(stop)} aria-label={`Open ${stop.title}`}>
      <div className={styles.eyebrow}>
        {stop.allDay ? 'All day' : stop.time} · {type?.label ?? stop.type}
      </div>
      <div className={styles.title}>{stop.title}</div>
      <div className={styles.meta}>
        {stop.location && `${stop.location} · `}
        {travelerLabel}
        {durationLabel && ` · ${durationLabel}`}
      </div>
    </Card>
  );
}

export const StopCard = memo(StopCardComponent);
