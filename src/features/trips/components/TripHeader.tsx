import { useState } from 'react';
import { CompassIcon } from '../../../shared/components/icons';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { getTripDateRange } from '../lib/dateRange';
import { downloadTripAsJson } from '../lib/tripFile';
import { getTripStatus, type Trip } from '../types';
import { EditDescriptionSheet } from './EditDescriptionSheet';
import { ShareSheet } from './ShareSheet';
import { TripMenuSheet } from './TripMenuSheet';
import styles from './TripHeader.module.css';

interface TripHeaderProps {
  trip: Trip;
  onBack: () => void;
  onArchiveToggle: () => void;
  onDuplicate: () => void;
  onDeleteRequest: () => void;
  onSaveTrip: (trip: Trip) => void;
}

// The in-trip tab bar moved to a bottom nav (see InTripBottomNav) — this
// header is now just identity + trip-level actions (share/menu), no
// navigation state.
export function TripHeader({ trip, onBack, onArchiveToggle, onDuplicate, onDeleteRequest, onSaveTrip }: TripHeaderProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editDescriptionOpen, setEditDescriptionOpen] = useState(false);
  const range = getTripDateRange(trip.legs, trip.flights);
  const status = trip.archived ? 'completed' : getTripStatus(range);
  const heroTone = status === 'completed' ? 'gray' : status === 'ongoing' || status === 'today' ? 'teal' : 'rust';

  return (
    <div className={styles.header}>
      <div className={styles.topRow}>
        <button type="button" className={styles.backLink} onClick={onBack}>
          ← Ταξίδια
        </button>
        <div className={styles.actions}>
          <button type="button" className={styles.shareButton} onClick={() => setShareOpen(true)}>
            Κοινή χρήση
          </button>
          <button type="button" className={styles.menuButton} onClick={() => setMenuOpen(true)} aria-label="Περισσότερα">
            ···
          </button>
        </div>
      </div>
      <div className={styles.heroCircle} data-tone={heroTone}>
        <CompassIcon size={24} />
      </div>
      <div className={styles.title}>{trip.title}</div>
      {range && (
        <div className={styles.dates}>
          {formatDateShort(range.startDate)} – {formatDateShort(range.endDate)}
        </div>
      )}
      {shareOpen && <ShareSheet trip={trip} onClose={() => setShareOpen(false)} onSave={onSaveTrip} />}
      {menuOpen && (
        <TripMenuSheet
          trip={trip}
          onClose={() => setMenuOpen(false)}
          onShare={() => setShareOpen(true)}
          onDuplicate={onDuplicate}
          onExport={() => downloadTripAsJson(trip)}
          onEditDescription={() => setEditDescriptionOpen(true)}
          onArchiveToggle={onArchiveToggle}
          onDelete={onDeleteRequest}
        />
      )}
      {editDescriptionOpen && (
        <EditDescriptionSheet trip={trip} onClose={() => setEditDescriptionOpen(false)} onSave={onSaveTrip} />
      )}
    </div>
  );
}
