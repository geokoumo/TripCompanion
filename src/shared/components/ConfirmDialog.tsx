import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Διαγραφή', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Ακύρωση
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ color: 'var(--color-text-muted)', paddingBottom: 16 }}>{message}</p>
    </Modal>
  );
}
