import { useCallback, useState } from 'react';
import type { Trip } from '../../trips/types';
import { Fab } from '../../../shared/components/Button';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useToast } from '../../../app/providers/ToastProvider';
import { deleteEntityWithUndo } from '../../../shared/lib/deleteWithUndo';
import { flightRelatedTo, retagDocuments } from '../../documents/lib/relatedTo';
import { findStopsOutOfRange, outOfRangeStopsMessage } from '../../itinerary/lib/outOfRangeStops';
import type { Flight } from '../types';
import { FlightCard } from './FlightCard';
import { FlightDetailView } from './FlightDetailView';
import { FlightForm } from './FlightForm';

interface FlightsTabProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
}

export function FlightsTab({ trip, updateTrip }: FlightsTabProps) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState<Flight | null>(null);
  const [viewing, setViewing] = useState<Flight | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Flight | null>(null);

  const sorted = [...trip.flights].sort((a, b) => (a.depDate + a.depTime).localeCompare(b.depDate + b.depTime));
  const openFlight = useCallback((flight: Flight) => setViewing(flight), []);

  const save = async (flight: Flight) => {
    let outOfRangeMessage: string | null = null;
    try {
      await updateTrip((t) => {
        const existing = t.flights.find((f) => f.id === flight.id);
        const flights = existing ? t.flights.map((f) => (f.id === flight.id ? flight : f)) : [...t.flights, flight];
        const documents = existing ? retagDocuments(t.documents, 'flight', flight.id, flightRelatedTo(existing), flightRelatedTo(flight)) : t.documents;
        const next = { ...t, flights, documents };
        // F-05: a flight edit can shrink the trip's derived date range —
        // surface any itinerary stop that's now outside it immediately,
        // rather than leaving it discoverable only via Trip Health.
        outOfRangeMessage = outOfRangeStopsMessage(findStopsOutOfRange(next));
        return next;
      });
      showToast('Flight saved.');
      if (outOfRangeMessage) showToast(outOfRangeMessage, { variant: 'warn' });
      setEditing(null);
      setCreating(false);
    } catch {
      // toast already shown by provider
    }
  };

  const remove = (flight: Flight) => {
    deleteEntityWithUndo({
      updateTrip,
      showToast,
      arrayKey: 'flights',
      id: flight.id,
      clearDocumentsRelatedTo: flightRelatedTo(flight),
      clearDocumentsSourceType: 'flight',
      clearDocumentsSourceId: flight.id,
    });
    setPendingDelete(null);
    setEditing(null);
  };

  return (
    // Bottom padding clears the floating "+" button so the last card in a
    // long list never sits underneath it.
    <div style={{ paddingTop: 8, paddingBottom: 90 }}>
      {sorted.length === 0 && (
        <EmptyState headline="No flights" body="Add your first flight with the button at the bottom right." />
      )}
      {sorted.map((flight) => (
        <FlightCard key={flight.id} flight={flight} onOpen={openFlight} />
      ))}

      <Fab onClick={() => setCreating(true)} aria-label="New flight" />

      {(creating || editing) && (
        <FlightForm
          trip={trip}
          updateTrip={updateTrip}
          initial={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(f) => save(f)}
          onDelete={editing ? () => setPendingDelete(editing) : undefined}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmSheet
          itemName={`${pendingDelete.airline} ${pendingDelete.flightNumber}`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => remove(pendingDelete)}
        />
      )}

      {viewing && (
        <FlightDetailView
          flight={viewing}
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
