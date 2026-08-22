import { useState } from 'react';
import { Fab } from '../../../shared/components/Button';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { useTrips } from '../hooks/useTrips';
import type { Trip } from '../types';
import { CreateTripWizard } from './CreateTripWizard';
import { TripCard } from './TripCard';
import styles from './TripListScreen.module.css';

interface TripListScreenProps {
  onOpenTrip: (tripId: string) => void;
}

export function TripListScreen({ onOpenTrip }: TripListScreenProps) {
  const { trips, loading, saveTrip, deleteTrip, duplicateTrip } = useTrips();
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Trip | null>(null);

  const visible = trips.filter((t) => (filter === 'active' ? !t.archived : t.archived));
  const todayLabel = formatDateShort(new Date().toISOString().slice(0, 10));

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Τα ταξίδια μου</h1>
      <div className={styles.subtitle}>Σήμερα {todayLabel}</div>

      <div className={styles.filters}>
        <button type="button" className={styles.filterChip} data-active={filter === 'active'} onClick={() => setFilter('active')}>
          Ενεργά
        </button>
        <button type="button" className={styles.filterChip} data-active={filter === 'archived'} onClick={() => setFilter('archived')}>
          Αρχείο
        </button>
      </div>

      {!loading && visible.length === 0 && (
        <div className={styles.empty}>
          {filter === 'active' ? 'Δεν υπάρχουν ενεργά ταξίδια ακόμα.' : 'Δεν υπάρχουν αρχειοθετημένα ταξίδια.'}
        </div>
      )}

      {visible.map((trip) => (
        <TripCard
          key={trip.id}
          trip={trip}
          onOpen={() => onOpenTrip(trip.id)}
          onArchiveToggle={() => void saveTrip({ ...trip, archived: !trip.archived })}
          onDuplicate={() => void duplicateTrip(trip.id)}
          onDelete={() => setPendingDelete(trip)}
        />
      ))}

      <Fab onClick={() => setWizardOpen(true)} />

      {wizardOpen && (
        <CreateTripWizard
          onClose={() => setWizardOpen(false)}
          onCreated={(tripId) => {
            setWizardOpen(false);
            onOpenTrip(tripId);
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Διαγραφή ταξιδιού"
          message={`Θα διαγραφεί μόνιμα το ταξίδι "${pendingDelete.title}". Η ενέργεια δεν αναιρείται.`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            void deleteTrip(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
