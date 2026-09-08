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
      title="Delete?"
      onClose={onCancel}
      footer={
        <Button variant="primary" onClick={onConfirm}>
          Yes, delete
        </Button>
      }
    >
      <p style={{ color: 'var(--color-text)', paddingTop: 4 }}>
        This deletes "{itemName}". Nothing in the other tabs changes.
      </p>
      <div
        style={{
          background: 'var(--color-rust-soft)',
          color: 'var(--color-danger)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          fontSize: 'var(--fs-meta)',
          marginTop: 12,
          marginBottom: 16,
        }}
      >
        This cannot be undone from here — but you get a 5-second Undo in the message that follows.
      </div>
    </Modal>
  );
}
