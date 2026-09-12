import { Suspense, useRef, useState } from 'react';
import { useToast } from '../../../app/providers/ToastProvider';
import { CreateTripWizardLazy, ShareSheetLazy } from '../../../app/lazyScreens';
import { ScreenLoadingFallback } from '../../../app/ScreenLoadingFallback';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { StampToggle } from '../../../shared/components/StampToggle';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { useTrips } from '../hooks/useTrips';
import { downloadTripAsJson, parseImportedTrip } from '../lib/tripFile';
import type { Trip, TripTab } from '../types';
import { EditDescriptionSheet } from './EditDescriptionSheet';
import { HelpSheet } from './HelpSheet';
import { TripCard } from './TripCard';
import { TripMenuSheet } from './TripMenuSheet';
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
  const [helpOpen, setHelpOpen] = useState(false);
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
      showToast('That file is not a valid trip.', { variant: 'error' });
      return;
    }

    try {
      await saveTrip(imported);
      showToast('Trip imported.');
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
    showToast('Deleted.', {
      variant: 'neutral',
      action: { label: 'Undo', onClick: () => void saveTrip(snapshot) },
    });
  };

  return (
    <div className={styles.screen}>
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.title}>My trips</h1>
          <div className={styles.subtitle}>Today {todayLabel}</div>
        </div>
        <button type="button" className={styles.helpButton} onClick={() => setHelpOpen(true)} aria-label="Help">
          ?
        </button>
      </div>

      <div className={styles.segmented}>
        <StampToggle
          options={[
            { id: 'active', label: 'Active' },
            { id: 'archived', label: 'Completed' },
          ]}
          value={filter}
          onChange={setFilter}
          variant="plain"
        />
      </div>

      {!loading && visible.length === 0 && (
        <EmptyState
          headline={filter === 'active' ? 'Nothing yet' : 'Nothing completed'}
          body={
            filter === 'active'
              ? 'Start with a title and dates. Everything else can wait.'
              : 'Trips you archive will collect here.'
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

      {shareTrip && (
        <Suspense fallback={<ScreenLoadingFallback />}>
          <ShareSheetLazy trip={shareTrip} onClose={() => setShareTrip(null)} onSave={(updated) => void saveTrip(updated)} />
        </Suspense>
      )}

      {editDescriptionTrip && (
        <EditDescriptionSheet trip={editDescriptionTrip} onClose={() => setEditDescriptionTrip(null)} onSave={(updated) => void saveTrip(updated)} />
      )}

      {duplicateSource && (
        <Suspense fallback={<ScreenLoadingFallback />}>
          <CreateTripWizardLazy
            onClose={() => setDuplicateSource(null)}
            onCreated={() => setDuplicateSource(null)}
            duplicateSeed={{
              categories: duplicateSource.budgetCategories,
              checklistTemplateItems: duplicateSource.checklistItems
                .filter((i) => i.travelerId === duplicateSource.travelers[0]?.id)
                .map(({ text, category, quantity }) => ({ text, category, quantity })),
            }}
          />
        </Suspense>
      )}

      {pendingDelete && (
        <DeleteConfirmSheet itemName={pendingDelete.title} onCancel={() => setPendingDelete(null)} onConfirm={confirmDeleteTrip} />
      )}

      {helpOpen && <HelpSheet onClose={() => setHelpOpen(false)} onImportFile={() => importInputRef.current?.click()} />}
      <input ref={importInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => void handleImportFile(e)} />
    </div>
  );
}
