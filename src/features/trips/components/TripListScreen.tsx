import { useState } from 'react';
import { useToast } from '../../../app/providers/ToastProvider';
import { Fab } from '../../../shared/components/Button';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { useTrips } from '../hooks/useTrips';
import type { Trip } from '../types';
import { CreateTripWizard } from './CreateTripWizard';
import { ShareSheet } from './ShareSheet';
import { TripCard } from './TripCard';
import { TripMenuSheet } from './TripMenuSheet';
import styles from './TripListScreen.module.css';

interface TripListScreenProps {
  onOpenTrip: (tripId: string) => void;
}

export function TripListScreen({ onOpenTrip }: TripListScreenProps) {
  const { trips, loading, saveTrip, deleteTrip } = useTrips();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [menuTrip, setMenuTrip] = useState<Trip | null>(null);
  const [shareTrip, setShareTrip] = useState<Trip | null>(null);
  const [duplicateSource, setDuplicateSource] = useState<Trip | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Trip | null>(null);

  const visible = trips.filter((t) => (filter === 'active' ? !t.archived : t.archived));
  const todayLabel = formatDateShort(new Date().toISOString().slice(0, 10));

  const confirmDeleteTrip = () => {
    if (!pendingDelete) return;
    const snapshot = pendingDelete;
    void deleteTrip(snapshot.id);
    setPendingDelete(null);
    showToast('Διαγράφηκε.', {
      variant: 'neutral',
      action: { label: 'Αναίρεση', onClick: () => void saveTrip(snapshot) },
    });
  };

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
        <EmptyState
          headline={filter === 'active' ? 'Κανένα ταξίδι ακόμα' : 'Κανένα αρχειοθετημένο ταξίδι'}
          body={
            filter === 'active'
              ? 'Ξεκίνα με τον τίτλο και τις ημερομηνίες. Όλα τα υπόλοιπα μπορούν να περιμένουν.'
              : 'Όσα ταξίδια αρχειοθετήσεις θα μαζεύονται εδώ.'
          }
        />
      )}

      {visible.map((trip) => (
        <TripCard key={trip.id} trip={trip} onOpen={() => onOpenTrip(trip.id)} onOpenMenu={() => setMenuTrip(trip)} />
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

      {menuTrip && (
        <TripMenuSheet
          trip={menuTrip}
          onClose={() => setMenuTrip(null)}
          onShare={() => setShareTrip(menuTrip)}
          onDuplicate={() => setDuplicateSource(menuTrip)}
          onArchiveToggle={() => void saveTrip({ ...menuTrip, archived: !menuTrip.archived })}
          onDelete={() => setPendingDelete(menuTrip)}
        />
      )}

      {shareTrip && <ShareSheet trip={shareTrip} onClose={() => setShareTrip(null)} onSave={(updated) => void saveTrip(updated)} />}

      {duplicateSource && (
        <CreateTripWizard
          onClose={() => setDuplicateSource(null)}
          onCreated={() => setDuplicateSource(null)}
          duplicateSeed={{
            categories: duplicateSource.budgetCategories,
            checklistTemplateItems: duplicateSource.checklistItems
              .filter((i) => i.travelerId === duplicateSource.travelers[0]?.id)
              .map(({ text, category, quantity }) => ({ text, category, quantity })),
          }}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmSheet itemName={pendingDelete.title} onCancel={() => setPendingDelete(null)} onConfirm={confirmDeleteTrip} />
      )}
    </div>
  );
}
