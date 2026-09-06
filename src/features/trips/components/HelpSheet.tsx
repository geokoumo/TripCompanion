import { Modal } from '../../../shared/components/Modal';
import styles from './HelpSheet.module.css';

interface HelpSheetProps {
  onClose: () => void;
  onImportFile: () => void;
}

/** Home screen's "?" button — a quick orientation plus the (otherwise homeless) trip-file import action. */
export function HelpSheet({ onClose, onImportFile }: HelpSheetProps) {
  return (
    <Modal title="Help" onClose={onClose}>
      <p className={styles.body}>
        Create a trip, then add flights, stays, an itinerary, a budget and a packing list from its tabs. Everything stays on this
        device unless you create an account to sync across devices.
      </p>
      <div className={styles.rows}>
        <button
          type="button"
          className={styles.row}
          onClick={() => {
            onClose();
            onImportFile();
          }}
        >
          Import a trip file
        </button>
      </div>
      <button type="button" className={styles.closeButton} onClick={onClose}>
        Close
      </button>
    </Modal>
  );
}
