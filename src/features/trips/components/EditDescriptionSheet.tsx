import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { TextAreaField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import type { Trip } from '../types';

interface EditDescriptionSheetProps {
  trip: Trip;
  onClose: () => void;
  onSave: (trip: Trip) => void;
}

/** The trip's settings/edit surface for Round 9's description field — reachable from the "..." menu, on Home and in-trip alike. */
export function EditDescriptionSheet({ trip, onClose, onSave }: EditDescriptionSheetProps) {
  const [description, setDescription] = useState(trip.description ?? '');

  const save = () => {
    onSave({ ...trip, description: description.trim() || undefined });
    onClose();
  };

  return (
    <Modal
      title="Trip description"
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={save}>
          Save
        </Button>
      }
    >
      <TextAreaField
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="A few words about the trip…"
        rows={4}
        autoFocus
      />
    </Modal>
  );
}
