import { useRef, useState } from 'react';
import { useToast } from '../../../app/providers/ToastProvider';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { useTrips } from '../hooks/useTrips';
import { downloadTripAsJson, parseImportedTrip } from '../lib/tripFile';
import type { Trip, TripTab } from '../types';
import { CreateTripWizard } from './CreateTripWizard';
import { EditDescriptionSheet } from './EditDescriptionSheet';
import { QuickActionsGrid } from './QuickActionsGrid';
import { ShareSheet } from './ShareSheet';
import { TripCard } from './TripCard';
import { TripMenuSheet } from './TripMenuSheet';
import { TripPickerSheet } from './TripPickerSheet';
import styles from './TripListScreen.module.css';

interface TripListScreenProps {
  onOpenTrip: (tripId: string, tab?: TripTab) => void;
}

export function TripListScreen({ onOpenTrip }: TripListScreenProps) {
  const { trips, loading, saveTrip, deleteTrip, getFullTrip } = useTrips();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [menuTrip, setMenuTrip] = useState<Trip | null>(null);
  const [shareTrip, setShareTrip] = useState<Trip | null>(null);
  const [duplicateSource, setDuplicateSource] = useState<Trip | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Trip | null>(null);
  const [editDescriptionTrip, setEditDescriptionTrip] = useState<Trip | null>(null);
  const [quickActionPicker, setQuickActionPicker] = useState<TripTab | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const visible = trips.filter((t) => (filter === 'active' ? !t.archived : t.archived));
  const activeTrips = trips.filter((t) => !t.archived);
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

  // A quick-action tile has no trip context of its own — resolve one: the
  // single active trip if there's exactly one, a lightweight picker if
  // there's more than one, or a nudge to create a trip first. Never a
  // silent no-op.
  const handleQuickAction = (tab: TripTab) => {
    if (activeTrips.length === 0) {
      showToast('Δημιούργησε πρώτα ένα ενεργό ταξίδι.', { variant: 'neutral' });
      return;
    }
    if (activeTrips.length === 1) {
      onOpenTrip(activeTrips[0]!.id, tab);
      return;
    }
    setQuickActionPicker(tab);
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

      <QuickActionsGrid onSelect={handleQuickAction} />

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

      {menuTrip && (
        <TripMenuSheet
          trip={menuTrip}
          onClose={() => setMenuTrip(null)}
          onShare={() => setShareTrip(menuTrip)}
          onDuplicate={() => setDuplicateSource(menuTrip)}
          onExport={() => downloadTripAsJson(menuTrip)}
          onEditDescription={() => setEditDescriptionTrip(menuTrip)}
          onArchiveToggle={() => void saveTrip({ ...menuTrip, archived: !menuTrip.archived })}
          onDelete={() => setPendingDelete(menuTrip)}
        />
      )}

      {shareTrip && <ShareSheet trip={shareTrip} onClose={() => setShareTrip(null)} onSave={(updated) => void saveTrip(updated)} />}

      {editDescriptionTrip && (
        <EditDescriptionSheet trip={editDescriptionTrip} onClose={() => setEditDescriptionTrip(null)} onSave={(updated) => void saveTrip(updated)} />
      )}

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

      {quickActionPicker && (
        <TripPickerSheet
          title="Ποιο ταξίδι;"
          trips={activeTrips}
          onClose={() => setQuickActionPicker(null)}
          onSelect={(tripId) => {
            onOpenTrip(tripId, quickActionPicker);
            setQuickActionPicker(null);
          }}
        />
      )}
    </div>
  );
}
