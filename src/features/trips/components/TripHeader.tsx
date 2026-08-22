import { useState } from 'react';
import { Menu } from '../../../shared/components/Menu';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { TRIP_TABS, type Trip, type TripTab } from '../types';
import { ShareSheet } from './ShareSheet';
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
  onDelete: () => void;
}

export function TripHeader({ trip, activeTab, onTabChange, onBack, onArchiveToggle, onDelete }: TripHeaderProps) {
  const [shareOpen, setShareOpen] = useState(false);

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
          <Menu
            items={[
              { label: trip.archived ? 'Επαναφορά' : 'Αρχειοθέτηση', onSelect: onArchiveToggle },
              { label: 'Διαγραφή', onSelect: onDelete, danger: true },
            ]}
          />
        </div>
      </div>
      <div className={styles.title}>{trip.title}</div>
      <div className={styles.dates}>
        {formatDateShort(trip.startDate)} – {formatDateShort(trip.endDate)}
      </div>
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
      {shareOpen && <ShareSheet trip={trip} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
