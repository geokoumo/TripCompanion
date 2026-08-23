import { useState } from 'react';
import { useToast } from '../../../app/providers/ToastProvider';
import { Fab } from '../../../shared/components/Button';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { deleteEntityWithUndo } from '../../../shared/lib/deleteWithUndo';
import type { Trip } from '../../trips/types';
import { dateTimeRangesOverlap } from '../lib/overlap';
import type { Stay } from '../types';
import { StayCard } from './StayCard';
import { StayForm } from './StayForm';

interface StaysTabProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
}

function toRange(stay: Stay) {
  return {
    start: { date: stay.checkinDate, time: stay.checkinTime },
    end: { date: stay.checkoutDate, time: stay.checkoutTime },
  };
}

export function StaysTab({ trip, updateTrip }: StaysTabProps) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState<Stay | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Stay | null>(null);

  const sorted = [...trip.stays].sort((a, b) => (a.checkinDate + a.checkinTime).localeCompare(b.checkinDate + b.checkinTime));

  const overlapIds = new Set<string>();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (dateTimeRangesOverlap(toRange(sorted[i]!), toRange(sorted[j]!))) {
        overlapIds.add(sorted[i]!.id);
        overlapIds.add(sorted[j]!.id);
      }
    }
  }

  const save = async (stay: Stay) => {
    try {
      await updateTrip((t) => {
        const exists = t.stays.some((s) => s.id === stay.id);
        return { ...t, stays: exists ? t.stays.map((s) => (s.id === stay.id ? stay : s)) : [...t.stays, stay] };
      });
      showToast('Η διαμονή αποθηκεύτηκε.');
      setEditing(null);
      setCreating(false);
    } catch {
      // toast already shown
    }
  };

  const remove = (id: string) => {
    deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'stays', id });
    setPendingDelete(null);
    setEditing(null);
  };

  return (
    <div style={{ paddingTop: 8 }}>
      {sorted.length === 0 && (
        <p style={{ color: 'var(--color-text-faint)', padding: '24px 0' }}>
          Καμία διαμονή
          <br />
          Καταχώρησε ξενοδοχείο ή κατάλυμα και θα δεις τα check-in στο πρόγραμμα.
        </p>
      )}
      {sorted.map((stay) => (
        <StayCard key={stay.id} stay={stay} overlapping={overlapIds.has(stay.id)} onOpen={() => setEditing(stay)} />
      ))}

      <Fab onClick={() => setCreating(true)} />

      {(creating || editing) && (
        <StayForm
          initial={editing ?? undefined}
          existingStays={trip.stays}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(s) => void save(s)}
          onDelete={editing ? () => setPendingDelete(editing) : undefined}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmSheet
          itemName={pendingDelete.name}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => remove(pendingDelete.id)}
        />
      )}
    </div>
  );
}
