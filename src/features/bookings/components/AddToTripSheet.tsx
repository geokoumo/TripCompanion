import { Modal } from '../../../shared/components/Modal';
import { ADD_TO_TRIP_GRID, type AddToTripDestination, type AddToTripGroup } from '../lib/bookingGridConfig';
import styles from './AddToTripSheet.module.css';

interface AddToTripSheetProps {
  onClose: () => void;
  onSelect: (destination: AddToTripDestination) => void;
}

const GROUPS: AddToTripGroup[] = ['BOOK', 'PLAN', 'STORE'];

/** Grouped BOOK/PLAN/STORE picker for everything that can go on a trip — Flights/Stays plus every booking_items type plus Documents. */
export function AddToTripSheet({ onClose, onSelect }: AddToTripSheetProps) {
  return (
    <Modal title="Quick Add" onClose={onClose}>
      {GROUPS.map((group) => (
        <div key={group} className={styles.group}>
          <div className={styles.groupLabel}>{group}</div>
          {ADD_TO_TRIP_GRID.filter((entry) => entry.group === group).map(({ id, label, description, Icon }) => (
            <button key={id} type="button" className={styles.row} onClick={() => onSelect(id)}>
              <Icon size={20} />
              <span className={styles.rowText}>
                <span className={styles.rowTitle}>{label}</span>
                <span className={styles.rowDescription}>{description}</span>
              </span>
              <span className={styles.addLabel}>Add</span>
            </button>
          ))}
        </div>
      ))}
    </Modal>
  );
}
