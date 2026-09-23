import { Suspense, useRef, useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { ShareSheetLazy } from '../../../app/lazyScreens';
import { ScreenLoadingFallback } from '../../../app/ScreenLoadingFallback';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { StampToggle } from '../../../shared/components/StampToggle';
import { formatDateShort, todayStr } from '../../../shared/lib/dateFormat';
import { deleteTripFile, isLocalDataUrl, readAsDataUrl, uploadTripFile, validateTripFile } from '../../../data/storage/tripFilesBucket';
import { useTrips } from '../hooks/useTrips';
import { cloneTripForDuplication } from '../lib/cloneTripForDuplication';
import { downloadTripAsJson, parseImportedTrip } from '../lib/tripFile';
import type { Trip, TripTab } from '../types';
import { ManageTravelersSheet } from '../../travelers/components/ManageTravelersSheet';
import { EditDescriptionSheet } from './EditDescriptionSheet';
import { HelpSheet } from './HelpSheet';
import { TripCard } from './TripCard';
import { TripMenuSheet } from './TripMenuSheet';
import styles from './TripListScreen.module.css';

interface TripListScreenProps {
  onOpenTrip: (tripId: string, tab?: TripTab) => void;
}

export function TripListScreen({ onOpenTrip }: TripListScreenProps) {
  const { user } = useAuth();
  const { trips, loading, saveTrip, deleteTrip, getFullTrip } = useTrips();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [menuTrip, setMenuTrip] = useState<Trip | null>(null);
  const [shareTrip, setShareTrip] = useState<Trip | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Trip | null>(null);
  const [editDescriptionTrip, setEditDescriptionTrip] = useState<Trip | null>(null);
  const [manageTravelersTrip, setManageTravelersTrip] = useState<Trip | null>(null);
  const [coverPhotoTrip, setCoverPhotoTrip] = useState<Trip | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);

  const visible = trips.filter((t) => (filter === 'active' ? !t.archived : t.archived));
  const todayLabel = formatDateShort(todayStr());

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

  const handleCoverPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const trip = coverPhotoTrip;
    setCoverPhotoTrip(null);
    if (!file || !trip) return;
    const validationError = validateTripFile(file);
    if (validationError) {
      showToast(validationError, { variant: 'error' });
      return;
    }
    try {
      const newPath = user ? await uploadTripFile(user.id, trip.id, file) : await readAsDataUrl(file);
      const oldPath = trip.coverPhotoPath;
      await saveTrip({ ...trip, coverPhotoPath: newPath });
      if (oldPath && !isLocalDataUrl(oldPath)) void deleteTripFile(oldPath);
      showToast('Cover photo updated.');
    } catch {
      showToast('Upload failed. Try again.', { variant: 'error' });
    }
  };

  const duplicateTrip = async (source: Trip) => {
    const clone = cloneTripForDuplication(source);
    try {
      await saveTrip(clone);
      showToast(`Duplicated as "${clone.title}".`);
      onOpenTrip(clone.id);
    } catch {
      // saveTrip already surfaces its own failure toast
    }
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
          onDuplicate={() => void duplicateTrip(menuTrip)}
          onExport={() => downloadTripAsJson(menuTrip)}
          onEditDescription={() => setEditDescriptionTrip(menuTrip)}
          onChangeCoverPhoto={() => {
            setCoverPhotoTrip(menuTrip);
            coverPhotoInputRef.current?.click();
          }}
          onManageTravelers={() => setManageTravelersTrip(menuTrip)}
          onArchiveToggle={() => void saveTrip({ ...menuTrip, archived: !menuTrip.archived })}
          onDelete={() => setPendingDelete(menuTrip)}
        />
      )}

      {manageTravelersTrip && (
        <ManageTravelersSheet trip={manageTravelersTrip} onClose={() => setManageTravelersTrip(null)} onSave={(updated) => saveTrip(updated)} />
      )}

      {shareTrip && (
        <Suspense fallback={<ScreenLoadingFallback />}>
          <ShareSheetLazy trip={shareTrip} onClose={() => setShareTrip(null)} onSave={(updated) => void saveTrip(updated)} />
        </Suspense>
      )}

      {editDescriptionTrip && (
        <EditDescriptionSheet trip={editDescriptionTrip} onClose={() => setEditDescriptionTrip(null)} onSave={(updated) => saveTrip(updated)} />
      )}

      {pendingDelete && (
        <DeleteConfirmSheet itemName={pendingDelete.title} onCancel={() => setPendingDelete(null)} onConfirm={confirmDeleteTrip} />
      )}

      {helpOpen && <HelpSheet onClose={() => setHelpOpen(false)} onImportFile={() => importInputRef.current?.click()} />}
      <input ref={importInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => void handleImportFile(e)} />
      <input ref={coverPhotoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => void handleCoverPhotoFile(e)} />
    </div>
  );
}
