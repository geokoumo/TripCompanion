import { BedIcon, CalendarIcon, PlaneIcon, WalletIcon } from '../../../shared/components/icons';
import type { TripTab } from '../types';
import styles from './QuickActionsGrid.module.css';

const ACTIONS: { tab: TripTab; label: string; tone: 'rust' | 'teal'; Icon: typeof PlaneIcon }[] = [
  { tab: 'flights', label: 'Πτήσεις', tone: 'rust', Icon: PlaneIcon },
  { tab: 'stays', label: 'Διαμονή', tone: 'teal', Icon: BedIcon },
  { tab: 'itinerary', label: 'Πρόγραμμα', tone: 'rust', Icon: CalendarIcon },
  { tab: 'budget', label: 'Budget', tone: 'teal', Icon: WalletIcon },
];

interface QuickActionsGridProps {
  onSelect: (tab: TripTab) => void;
}

/** Jumps into a tab of "the" relevant trip — TripListScreen resolves which trip that means (one active trip, a picker, or a prompt to create one). */
export function QuickActionsGrid({ onSelect }: QuickActionsGridProps) {
  return (
    <div className={styles.grid}>
      {ACTIONS.map(({ tab, label, tone, Icon }) => (
        <button key={tab} type="button" className={styles.tile} data-tone={tone} onClick={() => onSelect(tab)}>
          <Icon size={22} />
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </div>
  );
}
