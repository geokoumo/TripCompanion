import { Suspense, useRef, useState } from 'react';
import { ShareSheetLazy } from '../../../app/lazyScreens';
import { ScreenLoadingFallback } from '../../../app/ScreenLoadingFallback';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { deleteTripFile, isLocalDataUrl, readAsDataUrl, uploadTripFile, validateTripFile } from '../../../data/storage/tripFilesBucket';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { getTripDateRange } from '../lib/dateRange';
import { saveTripPatch } from '../lib/saveTripPatch';
import { downloadTripAsJson } from '../lib/tripFile';
import type { Trip } from '../types';
import { ManageTravelersSheet } from '../../travelers/components/ManageTravelersSheet';
import { EditDescriptionSheet } from './EditDescriptionSheet';
import { TripMenuSheet } from './TripMenuSheet';
import styles from './TripHeader.module.css';

interface TripHeaderProps {
  trip: Trip;
  onBack: () => void;
  onArchiveToggle: () => void;
  onDuplicate: () => void;
  onDeleteRequest: () => void;
  onSaveTrip: (trip: Trip) => void | Promise<void>;
  /** Overview's own meta-block already shows the trip's date range — set this there so it isn't shown twice. */
  hideDates?: boolean;
}

// The in-trip tab bar moved to a bottom nav (see InTripBottomNav) — this
// header is now just identity + trip-level actions (share/menu), no
// navigation state.
export function TripHeader({ trip, onBack, onArchiveToggle, onDuplicate, onDeleteRequest, onSaveTrip, hideDates = false }: TripHeaderProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { getFullTrip } = useTripsContext();
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editDescriptionOpen, setEditDescriptionOpen] = useState(false);
  const [manageTravelersOpen, setManageTravelersOpen] = useState(false);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);
  const range = getTripDateRange(trip.legs, trip.flights);

  const handleCoverPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const validationError = validateTripFile(file);
    if (validationError) {
      showToast(validationError, { variant: 'error' });
      return;
    }
    try {
      const newPath = user ? await uploadTripFile(user.id, trip.id, file) : await readAsDataUrl(file);
      // The path to clean up afterward is the fresh trip's own cover photo,
      // not this component's (possibly stale) prop — if another tab/device
      // already changed it since this screen loaded, that's the real old
      // object to remove, not whatever this component last rendered.
      const fresh = await saveTripPatch(trip.id, trip, { coverPhotoPath: newPath }, getFullTrip, onSaveTrip);
      if (fresh.coverPhotoPath && !isLocalDataUrl(fresh.coverPhotoPath)) void deleteTripFile(fresh.coverPhotoPath);
      showToast('Cover photo updated.');
    } catch {
      showToast('Upload failed. Try again.', { variant: 'error' });
    }
  };

  return (
    <div className={styles.header}>
      <div className={styles.topRow}>
        <button type="button" className={styles.backLink} onClick={onBack}>
          ← Trips
        </button>
        <div className={styles.actions}>
          <button type="button" className={styles.shareButton} onClick={() => setShareOpen(true)}>
            Share
          </button>
          <button type="button" className={styles.menuButton} onClick={() => setMenuOpen(true)} aria-label="More">
            ···
          </button>
        </div>
      </div>
      <div className={styles.title}>{trip.title}</div>
      {range && !hideDates && (
        <div className={styles.dates}>
          {formatDateShort(range.startDate)} – {formatDateShort(range.endDate)}
        </div>
      )}
      {shareOpen && (
        <Suspense fallback={<ScreenLoadingFallback />}>
          <ShareSheetLazy trip={trip} onClose={() => setShareOpen(false)} onSave={onSaveTrip} />
        </Suspense>
      )}
      {menuOpen && (
        <TripMenuSheet
          trip={trip}
          onClose={() => setMenuOpen(false)}
          onShare={() => setShareOpen(true)}
          onDuplicate={onDuplicate}
          onExport={() => downloadTripAsJson(trip)}
          onEditDescription={() => setEditDescriptionOpen(true)}
          onChangeCoverPhoto={() => coverPhotoInputRef.current?.click()}
          onManageTravelers={() => setManageTravelersOpen(true)}
          onArchiveToggle={onArchiveToggle}
          onDelete={onDeleteRequest}
        />
      )}
      {editDescriptionOpen && (
        <EditDescriptionSheet trip={trip} onClose={() => setEditDescriptionOpen(false)} onSave={onSaveTrip} />
      )}
      {manageTravelersOpen && (
        <ManageTravelersSheet trip={trip} onClose={() => setManageTravelersOpen(false)} onSave={onSaveTrip} />
      )}
      <input ref={coverPhotoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => void handleCoverPhotoFile(e)} />
    </div>
  );
}
