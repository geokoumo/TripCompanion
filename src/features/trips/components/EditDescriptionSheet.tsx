import { useState } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { Button } from '../../../shared/components/Button';
import { TextAreaField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { useSavingGuard } from '../../../shared/hooks/useSavingGuard';
import { saveTripPatch } from '../lib/saveTripPatch';
import type { Trip } from '../types';

interface EditDescriptionSheetProps {
  trip: Trip;
  onClose: () => void;
  onSave: (trip: Trip) => void | Promise<void>;
}

/** The trip's settings/edit surface for Round 9's description field — reachable from the "..." menu, on Home and in-trip alike. */
export function EditDescriptionSheet({ trip, onClose, onSave }: EditDescriptionSheetProps) {
  const { getFullTripOrThrow } = useTripsContext();
  const [description, setDescription] = useState(trip.description ?? '');
  const { saving, run } = useSavingGuard();

  // Only closes after the save actually persists — closing first (the old
  // behavior) would show "success" for a write that could still fail. Any
  // failure (including saveTripPatch's own abort when the trip is confirmed
  // gone) is swallowed the same way an ordinary save failure already was
  // here — the sheet just stays open, matching this sheet's existing
  // (toast-free) error handling.
  const save = () =>
    run(async () => {
      await saveTripPatch(trip.id, { description: description.trim() || undefined }, getFullTripOrThrow, onSave);
      onClose();
    }).catch(() => {});

  return (
    <Modal
      title="Trip description"
      onClose={onClose}
      footer={
        <Button variant="primary" disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Save'}
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
