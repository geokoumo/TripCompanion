import { useState } from 'react';
import { BOOKING_ITEM_TYPES, type BookingItemTypeId } from '../../../config/constants';
import { useToast } from '../../../app/providers/ToastProvider';
import { Fab } from '../../../shared/components/Button';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { deleteEntityWithUndo } from '../../../shared/lib/deleteWithUndo';
import { assertExists } from '../../../shared/lib/updateTripAbort';
import { upsertBookingItem } from '../../../data/repository/bookingRepository';
import { bookingItemRelatedTo, documentBelongsToSource } from '../../documents/lib/relatedTo';
import type { Trip } from '../../trips/types';
import { buildLinkedItineraryStop } from '../lib/addToItinerary';
import type { BookingItem } from '../types';
import { BookingItemCard } from './BookingItemCard';
import { BookingItemDetailView } from './BookingItemDetailView';
import { BookingItemForm } from './BookingItemForm';

interface BookingItemsListScreenProps {
  type: BookingItemTypeId;
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<{ ok: boolean } | void>;
}

function sortKey(item: BookingItem): string {
  return `${item.date ?? '9999-99-99'}${item.startTime ?? '99:99'}`;
}

export function BookingItemsListScreen({ type, trip, updateTrip }: BookingItemsListScreenProps) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState<BookingItem | null>(null);
  const [viewing, setViewing] = useState<BookingItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BookingItem | null>(null);

  const config = BOOKING_ITEM_TYPES.find((t) => t.id === type)!;
  const items = trip.bookingItems.filter((b) => b.type === type).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  const save = async (item: BookingItem, addToItinerary: boolean) => {
    const isEdit = editing !== null;
    try {
      // The booking item itself must always persist — a failed itinerary
      // side-effect is never a reason to lose the user's edit (F-02), and a
      // stop that couldn't be added is reported on its own rather than
      // stacked with a "saved" toast (F-19).
      let itineraryError: string | undefined;
      const result = await updateTrip((t) => {
        if (isEdit) assertExists(t.bookingItems, item.id, `This ${config.singular.toLowerCase()} was already deleted elsewhere.`);
        // Conflict-checked against the fresh trip updateTrip just fetched,
        // not the stale `trip` prop this screen opened with — otherwise a
        // stop added elsewhere since then would never be seen here.
        let stopToAdd: Trip['itineraryStops'][number] | undefined;
        if (addToItinerary) {
          const linked = buildLinkedItineraryStop(t, item);
          if ('conflictMessage' in linked) {
            itineraryError = linked.conflictMessage;
          } else {
            stopToAdd = linked.stop;
          }
        }
        const withItem = upsertBookingItem(t, item);
        return {
          ...withItem,
          itineraryStops: stopToAdd ? [...t.itineraryStops, stopToAdd] : t.itineraryStops,
        };
      });
      if (result && !result.ok) return;
      showToast(itineraryError ?? `${config.singular} saved.`, itineraryError ? { variant: 'error' } : undefined);
      setEditing(null);
      setCreating(false);
    } catch {
      // toast already shown by provider
    }
  };

  const remove = (item: BookingItem) => {
    deleteEntityWithUndo({
      updateTrip,
      showToast,
      arrayKey: 'bookingItems',
      id: item.id,
      clearDocumentsRelatedTo: bookingItemRelatedTo(item),
      clearDocumentsSourceType: 'booking',
      clearDocumentsSourceId: item.id,
    });
    setPendingDelete(null);
    setEditing(null);
  };

  return (
    // Bottom padding clears the floating "+" button so the last card in a
    // long list never sits underneath it.
    <div style={{ paddingTop: 8, paddingBottom: 90 }}>
      {items.length === 0 && (
        <EmptyState headline={`No ${config.label.toLowerCase()}`} body="Add your first one with the button at the bottom right." />
      )}
      {items.map((item) => (
        <BookingItemCard
          key={item.id}
          item={item}
          hasAttachment={trip.documents.some((d) => documentBelongsToSource(d, 'booking', item.id, bookingItemRelatedTo(item)))}
          onOpen={setViewing}
        />
      ))}

      <Fab onClick={() => setCreating(true)} aria-label={`New ${config.singular.toLowerCase()}`} />

      {(creating || editing) && (
        <BookingItemForm
          type={type}
          trip={trip}
          updateTrip={updateTrip}
          initial={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(item, addToItinerary) => save(item, addToItinerary)}
          onDelete={editing ? () => setPendingDelete(editing) : undefined}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmSheet itemName={pendingDelete.name} onCancel={() => setPendingDelete(null)} onConfirm={() => remove(pendingDelete)} />
      )}

      {viewing && (
        <BookingItemDetailView
          item={viewing}
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
