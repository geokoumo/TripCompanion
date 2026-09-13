import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { useSavingGuard } from '../../../shared/hooks/useSavingGuard';
import { generateId } from '../../../shared/lib/id';
import type { Trip } from '../../trips/types';
import { nextAvatarColor } from '../lib/avatarColors';
import { getTravelerRemovalImpact, removeTravelerFromTrip } from '../lib/travelerRemoval';
import type { Traveler } from '../types';
import styles from './ManageTravelersSheet.module.css';

interface ManageTravelersSheetProps {
  trip: Trip;
  onClose: () => void;
  onSave: (trip: Trip) => void | Promise<void>;
}

interface PendingRemoval {
  traveler: Traveler;
  blocked: boolean;
  checklistItemCount: number;
  stopAssignmentCount: number;
  expenseCount: number;
}

/**
 * View, add, rename, and remove travelers on a trip that already exists.
 * Uses the same domain model as trip creation — no parallel traveler logic.
 * Removal is blocked while an expense still names the traveler (paidBy or
 * splitAmong), since those are ON DELETE RESTRICT deliberately; a traveler's
 * own checklist items and itinerary-stop assignments are cascade-removed
 * with an explicit confirmation, mirroring the DB's own cascade behavior.
 */
export function ManageTravelersSheet({ trip, onClose, onSave }: ManageTravelersSheetProps) {
  const [travelers, setTravelers] = useState<Traveler[]>(trip.travelers);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);
  const { saving, run } = useSavingGuard();

  const originalIds = new Set(trip.travelers.map((t) => t.id));
  const addedCount = travelers.filter((t) => !originalIds.has(t.id)).length;

  const addToList = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setTravelers((prev) => [...prev, { id: generateId(), name: trimmed, avatarColor: nextAvatarColor(prev.length) }]);
    setName('');
  };

  const startEdit = (t: Traveler) => {
    setEditingId(t.id);
    setEditingName(t.name);
  };

  const saveEdit = () => {
    const trimmed = editingName.trim();
    if (trimmed) {
      setTravelers((prev) => prev.map((t) => (t.id === editingId ? { ...t, name: trimmed } : t)));
    }
    setEditingId(null);
  };

  const requestRemove = (t: Traveler) => {
    // A traveler added in this session but not yet saved can never be
    // referenced by an expense/checklist item/stop yet — remove immediately.
    if (!originalIds.has(t.id)) {
      setTravelers((prev) => prev.filter((p) => p.id !== t.id));
      return;
    }
    const impact = getTravelerRemovalImpact(trip, t.id);
    setPendingRemoval({
      traveler: t,
      blocked: impact.expenseCount > 0,
      checklistItemCount: impact.checklistItemCount,
      stopAssignmentCount: impact.stopAssignmentCount,
      expenseCount: impact.expenseCount,
    });
  };

  const confirmRemove = () => {
    if (!pendingRemoval || pendingRemoval.blocked) return;
    setTravelers((prev) => prev.filter((t) => t.id !== pendingRemoval.traveler.id));
    setPendingRemoval(null);
  };

  const nameChanged = travelers.some((t) => {
    const original = trip.travelers.find((o) => o.id === t.id);
    return original !== undefined && original.name !== t.name;
  });
  // A plain length check breaks when one traveler is removed and another
  // added in the same session (the counts happen to cancel out) — compare
  // membership by id instead of by count.
  const membershipChanged =
    travelers.some((t) => !originalIds.has(t.id)) || trip.travelers.some((t) => !travelers.some((w) => w.id === t.id));
  const canSave = membershipChanged || nameChanged;

  const save = () =>
    void run(async () => {
      const removedIds = trip.travelers.filter((t) => !travelers.some((w) => w.id === t.id)).map((t) => t.id);
      let updated = trip;
      for (const id of removedIds) updated = removeTravelerFromTrip(updated, id);
      await onSave({ ...updated, travelers });
      onClose();
    });

  return (
    <Modal
      title="Manage travelers"
      onClose={onClose}
      footer={
        <Button variant="primary" disabled={!canSave || saving} onClick={save}>
          {saving ? 'Saving…' : addedCount > 1 ? `Save (${addedCount} new)` : 'Save'}
        </Button>
      }
    >
      {travelers.map((t) => (
        <div key={t.id} className={styles.pendingItem}>
          {editingId === t.id ? (
            <div className={styles.editRow}>
              <TextField
                label="Name"
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    saveEdit();
                  }
                }}
              />
              <Button variant="secondary" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={saveEdit} disabled={!editingName.trim()}>
                Save
              </Button>
            </div>
          ) : (
            <>
              <span>{t.name}</span>
              <div className={styles.rowActions}>
                <button type="button" className={styles.editButton} onClick={() => startEdit(t)} aria-label={`Rename ${t.name}`}>
                  Rename
                </button>
                <button type="button" className={styles.removeButton} onClick={() => requestRemove(t)} aria-label={`Remove ${t.name}`}>
                  ✕
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      <div className={styles.addRow}>
        <TextField
          label="Name"
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
          + Add traveler
        </Button>
      </div>

      {pendingRemoval && (
        <Modal
          title={pendingRemoval.blocked ? "Can't remove" : `Remove ${pendingRemoval.traveler.name}?`}
          onClose={() => setPendingRemoval(null)}
          footer={
            pendingRemoval.blocked ? (
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setPendingRemoval(null)}>
                Close
              </Button>
            ) : (
              <>
                <Button variant="secondary" style={{ flex: 1 }} onClick={() => setPendingRemoval(null)}>
                  Cancel
                </Button>
                <Button variant="danger" style={{ flex: 1 }} onClick={confirmRemove}>
                  Remove
                </Button>
              </>
            )
          }
        >
          {pendingRemoval.blocked ? (
            <p className={styles.impactText}>
              {pendingRemoval.traveler.name} is linked to {pendingRemoval.expenseCount}{' '}
              {pendingRemoval.expenseCount === 1 ? 'expense' : 'expenses'} (as payer or in a split). Reassign or delete{' '}
              {pendingRemoval.expenseCount === 1 ? 'that expense' : 'those expenses'} first, then remove them here.
            </p>
          ) : (
            <p className={styles.impactText}>
              {pendingRemoval.checklistItemCount > 0 &&
                `This removes ${pendingRemoval.checklistItemCount} of their checklist item${pendingRemoval.checklistItemCount === 1 ? '' : 's'}. `}
              {pendingRemoval.stopAssignmentCount > 0 &&
                `They'll be unassigned from ${pendingRemoval.stopAssignmentCount} activit${pendingRemoval.stopAssignmentCount === 1 ? 'y' : 'ies'} (the activities stay). `}
              {pendingRemoval.checklistItemCount === 0 && pendingRemoval.stopAssignmentCount === 0 && 'This cannot be undone from here.'}
            </p>
          )}
        </Modal>
      )}
    </Modal>
  );
}
