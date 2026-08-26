import { useState } from 'react';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { getTripDateRange } from '../lib/dateRange';
import { downloadTripAsJson } from '../lib/tripFile';
import { TRIP_TABS, type Trip, type TripTab } from '../types';
import { ShareSheet } from './ShareSheet';
import { TripMenuSheet } from './TripMenuSheet';
import styles from './TripHeader.module.css';

const TAB_LABELS: Record<TripTab, string> = {
  overview: 'Επισκόπηση',
  flights: 'Πτήσεις',
  stays: 'Διαμονή',
  itinerary: 'Πρόγραμμα',
  budget: 'Budget',
  checklist: 'Βαλίτσα',
};

interface TripHeaderProps {
  trip: Trip;
  activeTab: TripTab;
  onTabChange: (tab: TripTab) => void;
  onBack: () => void;
  onArchiveToggle: () => void;
  onDuplicate: () => void;
  onDeleteRequest: () => void;
  onSaveTrip: (trip: Trip) => void;
}

export function TripHeader({ trip, activeTab, onTabChange, onBack, onArchiveToggle, onDuplicate, onDeleteRequest, onSaveTrip }: TripHeaderProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const range = getTripDateRange(trip.legs, trip.flights);

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
      <div className={styles.title}>{trip.title}</div>
      {range && (
        <div className={styles.dates}>
          {formatDateShort(range.startDate)} – {formatDateShort(range.endDate)}
        </div>
      )}
      <div className={styles.tabsWrapper}>
        <div className={styles.tabs}>
          {TRIP_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={styles.tab}
              data-active={tab === activeTab}
              onClick={() => onTabChange(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>
      {shareOpen && <ShareSheet trip={trip} onClose={() => setShareOpen(false)} onSave={onSaveTrip} />}
      {menuOpen && (
        <TripMenuSheet
          trip={trip}
          onClose={() => setMenuOpen(false)}
          onShare={() => setShareOpen(true)}
          onDuplicate={onDuplicate}
          onExport={() => downloadTripAsJson(trip)}
          onArchiveToggle={onArchiveToggle}
          onDelete={onDeleteRequest}
        />
      )}
    </div>
  );
}
