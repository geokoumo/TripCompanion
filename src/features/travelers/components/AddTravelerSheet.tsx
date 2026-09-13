import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { useSavingGuard } from '../../../shared/hooks/useSavingGuard';
import { generateId } from '../../../shared/lib/id';
import type { Trip } from '../../trips/types';
import { nextAvatarColor } from '../lib/avatarColors';
import type { Traveler } from '../types';
import styles from './AddTravelerSheet.module.css';

interface AddTravelerSheetProps {
  trip: Trip;
  onClose: () => void;
  onSave: (trip: Trip) => void | Promise<void>;
}

/**
 * The only way to add a traveler to a trip that already exists — the
 * Create Trip wizard's own travelers step only ever runs once, at
 * creation, so a person confirming later that they're joining (a very
 * ordinary thing to happen after a trip's already being planned) had no
 * path in at all. Deliberately add-only: removing an existing traveler
 * here would need to account for their expense/checklist history, which
 * this sheet doesn't touch.
 */
export function AddTravelerSheet({ trip, onClose, onSave }: AddTravelerSheetProps) {
  const [pending, setPending] = useState<Traveler[]>([]);
  const [name, setName] = useState('');
  const { saving, run } = useSavingGuard();

  const addToList = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPending((prev) => [...prev, { id: generateId(), name: trimmed, avatarColor: nextAvatarColor(trip.travelers.length + prev.length) }]);
    setName('');
  };

  const removePending = (id: string) => setPending((prev) => prev.filter((p) => p.id !== id));

  const canSave = pending.length > 0;

  const save = () =>
    void run(async () => {
      await onSave({ ...trip, travelers: [...trip.travelers, ...pending] });
      onClose();
    });

  return (
    <Modal
      title="Add traveler"
      onClose={onClose}
      footer={
        <Button variant="primary" disabled={!canSave || saving} onClick={save}>
          {saving ? 'Saving…' : pending.length > 1 ? `Add ${pending.length} travelers` : 'Add traveler'}
        </Button>
      }
    >
      {trip.travelers.length > 0 && (
        <div className={styles.existing}>
          <div className={styles.existingLabel}>Already on this trip</div>
          <div className={styles.existingNames}>{trip.travelers.map((t) => t.name).join(', ')}</div>
        </div>
      )}

      {pending.map((t) => (
        <div key={t.id} className={styles.pendingItem}>
          <span>{t.name}</span>
          <button type="button" className={styles.removeButton} onClick={() => removePending(t.id)} aria-label={`Remove ${t.name}`}>
            ✕
          </button>
        </div>
      ))}

      <div className={styles.addRow}>
        <TextField
          label="Name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addToList();
            }
          }}
          placeholder="e.g. Maria"
        />
        <Button variant="secondary" onClick={addToList} disabled={!name.trim()}>
          + Add to list
        </Button>
      </div>
    </Modal>
  );
}
