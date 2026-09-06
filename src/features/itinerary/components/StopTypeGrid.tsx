import { ITINERARY_STOP_TYPES, type ItineraryStopTypeId } from '../../../config/constants';
import styles from './StopTypeGrid.module.css';

interface StopTypeGridProps {
  value: ItineraryStopTypeId;
  onChange: (value: ItineraryStopTypeId) => void;
}

/** The stop-type picker's one deliberate break from the app's rust-selected convention — a teal-tinted tile grid, not a pill row. */
export function StopTypeGrid({ value, onChange }: StopTypeGridProps) {
  return (
    <div className={styles.grid}>
      {ITINERARY_STOP_TYPES.map((t) => (
        <button key={t.id} type="button" className={styles.tile} data-active={t.id === value} onClick={() => onChange(t.id)}>
          <span className={styles.glyph}>{t.letter}</span>
          <span className={styles.label}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
