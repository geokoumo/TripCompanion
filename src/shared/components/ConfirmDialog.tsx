import { Modal } from './Modal';
import { Button } from './Button';

interface DeleteConfirmSheetProps {
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** The one delete-confirmation pattern used everywhere: flight, stay, stop, expense, trip. */
export function DeleteConfirmSheet({ itemName, onConfirm, onCancel }: DeleteConfirmSheetProps) {
  return (
    <Modal
      title="Διαγραφή;"
      onClose={onCancel}
      footer={
        <Button variant="primary" onClick={onConfirm}>
          Ναι, διαγραφή
        </Button>
      }
    >
      <p style={{ color: 'var(--color-text)', paddingTop: 4 }}>
        Θα διαγραφεί «{itemName}». Δεν επηρεάζονται άλλες καρτέλες.
      </p>
      <div
        style={{
          background: 'var(--color-rust-soft)',
          color: 'var(--color-rust-on-soft)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          fontSize: 'var(--fs-meta)',
          marginTop: 12,
          marginBottom: 16,
        }}
      >
        Η ενέργεια δεν αναιρείται από εδώ — θα έχεις όμως 5 δευτερόλεπτα «Αναίρεση» στο μήνυμα που ακολουθεί.
      </div>
    </Modal>
  );
}
