import { useCallback, useState } from 'react';
import { useToast } from '../../../app/providers/ToastProvider';
import { Fab } from '../../../shared/components/Button';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { deleteEntityWithUndo } from '../../../shared/lib/deleteWithUndo';
import { assertExists } from '../../../shared/lib/updateTripAbort';
import { retagDocuments, stayRelatedTo } from '../../documents/lib/relatedTo';
import { findStopsOutOfRange, outOfRangeStopsMessage } from '../../itinerary/lib/outOfRangeStops';
import type { Trip } from '../../trips/types';
import { addRememberedLocation } from '../../trips/lib/rememberedLocations';
import { dateTimeRangesOverlap } from '../lib/overlap';
import type { Stay } from '../types';
import { StayCard } from './StayCard';
import { StayDetailView } from './StayDetailView';
import { StayForm } from './StayForm';

interface StaysTabProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<{ ok: boolean } | void>;
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
  const [viewing, setViewing] = useState<Stay | null>(null);
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

  const openStay = useCallback((stay: Stay) => setViewing(stay), []);

  const save = async (stay: Stay) => {
    const isEdit = editing !== null;
    let outOfRangeMessage: string | null = null;
    try {
      const result = await updateTrip((t) => {
        if (isEdit) assertExists(t.stays, stay.id, 'This stay was already deleted elsewhere.');
        const existing = t.stays.find((s) => s.id === stay.id);
        const stays = existing ? t.stays.map((s) => (s.id === stay.id ? stay : s)) : [...t.stays, stay];
        const rememberedLocations = stay.address ? addRememberedLocation(t.rememberedLocations, stay.address) : t.rememberedLocations;
        const documents = existing ? retagDocuments(t.documents, 'stay', stay.id, stayRelatedTo(existing), stayRelatedTo(stay)) : t.documents;
        const next = { ...t, stays, rememberedLocations, documents };
        // F-05: a stay edit can shrink the trip's derived date range —
        // surface any itinerary stop that's now outside it immediately,
        // rather than leaving it discoverable only via Trip Health.
        outOfRangeMessage = outOfRangeStopsMessage(findStopsOutOfRange(next));
        return next;
      });
      if (result && !result.ok) return;
      showToast('Stay saved.');
      if (outOfRangeMessage) showToast(outOfRangeMessage, { variant: 'warn' });
      setEditing(null);
      setCreating(false);
    } catch {
      // toast already shown
    }
  };

  const remove = (stay: Stay) => {
    deleteEntityWithUndo({
      updateTrip,
      showToast,
      arrayKey: 'stays',
      id: stay.id,
      clearDocumentsRelatedTo: stayRelatedTo(stay),
      clearDocumentsSourceType: 'stay',
      clearDocumentsSourceId: stay.id,
    });
    setPendingDelete(null);
    setEditing(null);
  };

  return (
    // Bottom padding clears the floating "+" button so the last card in a
    // long list never sits underneath it.
    <div style={{ paddingTop: 8, paddingBottom: 90 }}>
      {sorted.length === 0 && (
        <EmptyState headline="No stays" body="Add your first stay with the button at the bottom right." />
      )}
      {sorted.map((stay) => (
        <StayCard key={stay.id} stay={stay} overlapping={overlapIds.has(stay.id)} onOpen={openStay} />
      ))}

      <Fab onClick={() => setCreating(true)} aria-label="New stay" />

      {(creating || editing) && (
        <StayForm
          trip={trip}
          updateTrip={updateTrip}
          initial={editing ?? undefined}
          existingStays={trip.stays}
          recentLocations={trip.rememberedLocations}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(s) => save(s)}
          onDelete={editing ? () => setPendingDelete(editing) : undefined}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmSheet
          itemName={pendingDelete.name}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => remove(pendingDelete)}
        />
      )}

      {viewing && (
        <StayDetailView
          stay={viewing}
          trip={trip}
          updateTrip={updateTrip}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
        />
      )}
    </div>
  );
}
