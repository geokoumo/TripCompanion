import { useState } from 'react';
import { BOOKING_ITEM_TYPES, type BookingItemTypeId } from '../../../config/constants';
import { useToast } from '../../../app/providers/ToastProvider';
import { Fab } from '../../../shared/components/Button';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { deleteEntityWithUndo } from '../../../shared/lib/deleteWithUndo';
import { upsertBookingItem } from '../../../data/repository/bookingRepository';
import type { Trip } from '../../trips/types';
import { buildLinkedItineraryStop } from '../lib/addToItinerary';
import type { BookingItem } from '../types';
import { BookingItemCard } from './BookingItemCard';
import { BookingItemForm } from './BookingItemForm';

interface BookingItemsListScreenProps {
  type: BookingItemTypeId;
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
}

function sortKey(item: BookingItem): string {
  return `${item.date ?? '9999-99-99'}${item.startTime ?? '99:99'}`;
}

export function BookingItemsListScreen({ type, trip, updateTrip }: BookingItemsListScreenProps) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState<BookingItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BookingItem | null>(null);

  const config = BOOKING_ITEM_TYPES.find((t) => t.id === type)!;
  const items = trip.bookingItems.filter((b) => b.type === type).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  const save = async (item: BookingItem, addToItinerary: boolean) => {
    try {
      let stopToAdd: Trip['itineraryStops'][number] | undefined;
      if (addToItinerary) {
        const result = buildLinkedItineraryStop(trip, item);
        if ('conflictMessage' in result) {
          showToast(result.conflictMessage, { variant: 'error' });
        } else if ('stop' in result) {
          stopToAdd = result.stop;
        }
      }

      await updateTrip((t) => {
        const withItem = upsertBookingItem(t, item);
        return {
          ...withItem,
          itineraryStops: stopToAdd ? [...t.itineraryStops, stopToAdd] : t.itineraryStops,
        };
      });
      showToast(`${config.singular} saved.`);
      setEditing(null);
      setCreating(false);
    } catch {
      // toast already shown by provider
    }
  };

  const remove = (id: string) => {
    deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'bookingItems', id });
    setPendingDelete(null);
    setEditing(null);
  };

  return (
    <div style={{ paddingTop: 8 }}>
      {items.length === 0 && (
        <EmptyState headline={`No ${config.label.toLowerCase()}`} body="Add your first one with the button at the bottom right." />
      )}
      {items.map((item) => (
        <BookingItemCard
          key={item.id}
          item={item}
          hasAttachment={trip.documents.some((d) => d.relatedTo === item.name)}
          onOpen={setEditing}
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
          onSave={(item, addToItinerary) => void save(item, addToItinerary)}
          onDelete={editing ? () => setPendingDelete(editing) : undefined}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmSheet itemName={pendingDelete.name} onCancel={() => setPendingDelete(null)} onConfirm={() => remove(pendingDelete.id)} />
      )}
    </div>
  );
}
