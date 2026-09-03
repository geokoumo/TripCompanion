import { Modal } from '../../../shared/components/Modal';
import type { TripListItem } from '../types';
import styles from './TripPickerSheet.module.css';

interface TripPickerSheetProps {
  title: string;
  trips: TripListItem[];
  onSelect: (tripId: string) => void;
  onClose: () => void;
}

/** Lightweight "which trip did you mean" picker — not a navigation flow, just resolves an ambiguous tap. */
export function TripPickerSheet({ title, trips, onSelect, onClose }: TripPickerSheetProps) {
  return (
    <Modal title={title} onClose={onClose}>
      {trips.map((trip) => (
        <button key={trip.id} type="button" className={styles.row} onClick={() => onSelect(trip.id)}>
          {trip.title}
        </button>
      ))}
    </Modal>
  );
}
