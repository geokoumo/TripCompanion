import { Modal } from '../../../shared/components/Modal';
import type { Trip } from '../types';
import styles from './TripMenuSheet.module.css';

interface TripMenuSheetProps {
  trip: Trip;
  onClose: () => void;
  onShare: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
}

export function TripMenuSheet({ trip, onClose, onShare, onDuplicate, onExport, onArchiveToggle, onDelete }: TripMenuSheetProps) {
  const run = (fn: () => void) => {
    onClose();
    fn();
  };

  return (
    <Modal title={trip.title} onClose={onClose}>
      <button type="button" className={styles.row} onClick={() => run(onShare)}>
        Κοινή χρήση
      </button>
      <button type="button" className={styles.row} onClick={() => run(onDuplicate)}>
        Αντιγραφή ταξιδιού
      </button>
      <button type="button" className={styles.row} onClick={() => run(onExport)}>
        Εξαγωγή σε αρχείο
      </button>
      <button type="button" className={styles.row} onClick={() => run(onArchiveToggle)}>
        {trip.archived ? 'Επαναφορά από αρχείο' : 'Αρχειοθέτηση'}
      </button>
      <button type="button" className={styles.row} data-danger="true" onClick={() => run(onDelete)}>
        Διαγραφή ταξιδιού
      </button>
    </Modal>
  );
}
