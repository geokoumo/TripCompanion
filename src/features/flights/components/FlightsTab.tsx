import { useState } from 'react';
import type { Trip } from '../../trips/types';
import { Fab } from '../../../shared/components/Button';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { useToast } from '../../../app/providers/ToastProvider';
import { deleteEntityWithUndo } from '../../../shared/lib/deleteWithUndo';
import type { Flight } from '../types';
import { FlightCard } from './FlightCard';
import { FlightForm } from './FlightForm';

interface FlightsTabProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
}

export function FlightsTab({ trip, updateTrip }: FlightsTabProps) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState<Flight | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Flight | null>(null);

  const sorted = [...trip.flights].sort((a, b) => (a.depDate + a.depTime).localeCompare(b.depDate + b.depTime));

  const save = async (flight: Flight) => {
    try {
      await updateTrip((t) => {
        const exists = t.flights.some((f) => f.id === flight.id);
        return { ...t, flights: exists ? t.flights.map((f) => (f.id === flight.id ? flight : f)) : [...t.flights, flight] };
      });
      showToast('Η πτήση αποθηκεύτηκε.');
      setEditing(null);
      setCreating(false);
    } catch {
      // toast already shown by provider
    }
  };

  const remove = (id: string) => {
    deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'flights', id });
    setPendingDelete(null);
    setEditing(null);
  };

  return (
    <div style={{ paddingTop: 8 }}>
      {sorted.length === 0 && (
        <p style={{ color: 'var(--color-text-faint)', padding: '24px 0' }}>
          Καμία πτήση
          <br />
          Πρόσθεσε την πρώτη σου πτήση με το κουμπί κάτω δεξιά.
        </p>
      )}
      {sorted.map((flight) => (
        <FlightCard key={flight.id} flight={flight} onOpen={() => setEditing(flight)} />
      ))}

      <Fab onClick={() => setCreating(true)} />

      {(creating || editing) && (
        <FlightForm
          initial={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(f) => void save(f)}
          onDelete={editing ? () => setPendingDelete(editing) : undefined}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmSheet
          itemName={`${pendingDelete.airline} ${pendingDelete.flightNumber}`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => remove(pendingDelete.id)}
        />
      )}
    </div>
  );
}
