import { Modal } from '../../../shared/components/Modal';
import type { Trip } from '../types';
import styles from './TripMenuSheet.module.css';

interface TripMenuSheetProps {
  trip: Trip;
  onClose: () => void;
  onShare: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onEditDescription: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
}

export function TripMenuSheet({ trip, onClose, onShare, onDuplicate, onExport, onEditDescription, onArchiveToggle, onDelete }: TripMenuSheetProps) {
  const run = (fn: () => void) => {
    onClose();
    fn();
  };

  return (
    <Modal title={trip.title} onClose={onClose}>
      <div className={styles.rows}>
        <button type="button" className={styles.row} onClick={() => run(onShare)}>
          Share
        </button>
        <button type="button" className={styles.row} onClick={() => run(onDuplicate)}>
          Duplicate trip
        </button>
        <button type="button" className={styles.row} onClick={() => run(onExport)}>
          Export to file
        </button>
        <button type="button" className={styles.row} onClick={() => run(onEditDescription)}>
          {trip.description ? 'Edit description' : 'Add description'}
        </button>
        <button type="button" className={styles.row} onClick={() => run(onArchiveToggle)}>
          {trip.archived ? 'Restore from archive' : 'Archive trip'}
        </button>
        <button type="button" className={styles.row} data-danger="true" onClick={() => run(onDelete)}>
          Delete trip
        </button>
      </div>
      <button type="button" className={styles.closeButton} onClick={onClose}>
        Close
      </button>
    </Modal>
  );
}
