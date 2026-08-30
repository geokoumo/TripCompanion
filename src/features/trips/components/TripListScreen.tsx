import { useRef, useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { AuthSheet } from '../../auth/components/AuthSheet';
import { LocalTripsImportPrompt } from '../../auth/components/LocalTripsImportPrompt';
import { useLocalTripsImportPrompt } from '../../auth/lib/localImportPrompt';
import { Fab } from '../../../shared/components/Button';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { useTrips } from '../hooks/useTrips';
import { downloadTripAsJson, parseImportedTrip } from '../lib/tripFile';
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
  const { trips, loading, saveTrip, deleteTrip, getFullTrip } = useTrips();
  const { showToast } = useToast();
  const { user, enabled, signOut } = useAuth();
  const { localTrips, dismiss: dismissLocalTripsPrompt } = useLocalTripsImportPrompt(!!user);
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuTrip, setMenuTrip] = useState<Trip | null>(null);
  const [shareTrip, setShareTrip] = useState<Trip | null>(null);
  const [duplicateSource, setDuplicateSource] = useState<Trip | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Trip | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const visible = trips.filter((t) => (filter === 'active' ? !t.archived : t.archived));
  const todayLabel = formatDateShort(new Date().toISOString().slice(0, 10));

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    let imported: Trip;
    try {
      const text = await file.text();
      imported = parseImportedTrip(text);
    } catch {
      showToast('Το αρχείο δεν είναι έγκυρο ταξίδι.', { variant: 'error' });
      return;
    }

    try {
      await saveTrip(imported);
      showToast('Το ταξίδι εισήχθη.');
    } catch {
      // saveTrip already surfaced its own error toast
    }
  };

  // TripCard only carries the list summary — the "..." menu (and everything
  // reachable from it: share/duplicate/archive/delete) needs the full trip,
  // so fetch it once here rather than bulk-loading full trips up front.
  const openMenuFor = async (id: string) => {
    const full = await getFullTrip(id);
    if (full) setMenuTrip(full);
  };

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
      {enabled && (
        <div className={styles.accountRow}>
          {user ? (
            <>
              <span className={styles.accountEmail}>{user.email}</span>
              <button type="button" className={styles.accountButton} onClick={() => void signOut()}>
                Αποσύνδεση
              </button>
            </>
          ) : (
            <button type="button" className={styles.accountButton} onClick={() => setAuthOpen(true)}>
              Σύνδεση
            </button>
          )}
        </div>
      )}
      <h1 className={styles.title}>Τα ταξίδια μου</h1>
      <div className={styles.subtitle}>Σήμερα {todayLabel}</div>

      <div className={styles.filters}>
        <button type="button" className={styles.filterChip} data-active={filter === 'active'} onClick={() => setFilter('active')}>
          Ενεργά
        </button>
        <button type="button" className={styles.filterChip} data-active={filter === 'archived'} onClick={() => setFilter('archived')}>
          Αρχείο
        </button>
        <button type="button" className={styles.importButton} onClick={() => importInputRef.current?.click()}>
          Εισαγωγή ταξιδιού
        </button>
        <input ref={importInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => void handleImportFile(e)} />
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
        <TripCard key={trip.id} trip={trip} onOpen={() => onOpenTrip(trip.id)} onOpenMenu={() => void openMenuFor(trip.id)} />
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
          onExport={() => downloadTripAsJson(menuTrip)}
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

      {authOpen && <AuthSheet onClose={() => setAuthOpen(false)} />}

      {localTrips && <LocalTripsImportPrompt localTrips={localTrips} onClose={dismissLocalTripsPrompt} />}
    </div>
  );
}
