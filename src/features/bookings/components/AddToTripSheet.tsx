import { Modal } from '../../../shared/components/Modal';
import { IconCircle } from '../../../shared/components/IconCircle';
import { ADD_TO_TRIP_GRID, type AddToTripDestination } from '../lib/bookingGridConfig';
import styles from './AddToTripSheet.module.css';

interface AddToTripSheetProps {
  onClose: () => void;
  onSelect: (destination: AddToTripDestination) => void;
}

/** The 2-column icon-grid picker for everything that can go on a trip — Flights/Stays plus every booking type plus Documents. */
export function AddToTripSheet({ onClose, onSelect }: AddToTripSheetProps) {
  return (
    <Modal title="Add to trip" onClose={onClose}>
      <div className={styles.grid}>
        {ADD_TO_TRIP_GRID.map(({ id, label, Icon, tone }) => (
          <button key={id} type="button" className={styles.tile} onClick={() => onSelect(id)}>
            <IconCircle tone={tone} size={44}>
              <Icon size={22} />
            </IconCircle>
            <span className={styles.label}>{label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
