import { BackpackIcon, CompassIcon, ListIcon, TicketIcon, WalletIcon } from '../../../shared/components/icons';
import type { TripTab } from '../types';
import styles from './InTripBottomNav.module.css';

const NAV_ITEMS: { key: TripTab | 'bookings'; label: string; Icon: typeof CompassIcon; navigateTab: TripTab }[] = [
  { key: 'overview', label: 'Επισκόπηση', Icon: CompassIcon, navigateTab: 'overview' },
  { key: 'itinerary', label: 'Πρόγραμμα', Icon: ListIcon, navigateTab: 'itinerary' },
  { key: 'bookings', label: 'Κρατήσεις', Icon: TicketIcon, navigateTab: 'flights' },
  { key: 'budget', label: 'Budget', Icon: WalletIcon, navigateTab: 'budget' },
  { key: 'checklist', label: 'Βαλίτσα', Icon: BackpackIcon, navigateTab: 'checklist' },
];

function isActive(itemKey: TripTab | 'bookings', activeTab: TripTab): boolean {
  if (itemKey === 'bookings') return activeTab === 'flights' || activeTab === 'stays';
  return itemKey === activeTab;
}

interface InTripBottomNavProps {
  activeTab: TripTab;
  onTabChange: (tab: TripTab) => void;
}

/** The 5-destination in-trip navigation (replaces the old 6-chip horizontal scroller) — Bookings groups Flights + Stays. */
export function InTripBottomNav({ activeTab, onTabChange }: InTripBottomNavProps) {
  return (
    <nav className={styles.bar}>
      {NAV_ITEMS.map(({ key, label, Icon, navigateTab }) => (
        <button
          key={key}
          type="button"
          className={styles.item}
          data-active={isActive(key, activeTab)}
          onClick={() => onTabChange(navigateTab)}
        >
          <Icon size={20} />
          {label}
        </button>
      ))}
    </nav>
  );
}
