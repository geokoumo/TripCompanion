import { HomeIcon, SearchIcon, UserIcon } from '../shared/components/icons';
import type { TopLevelTab } from '../shared/lib/useHashRoute';
import styles from './BottomNav.module.css';

interface BottomNavProps {
  active: TopLevelTab;
  onNavigate: (tab: TopLevelTab) => void;
  onCreateTrip: () => void;
  /** Account is a bottom sheet, not a routed screen — highlighted while it's open. */
  accountActive: boolean;
  onAccountTap: () => void;
}

/** App-shell-level primary navigation — unrelated to the in-trip tab bar (Επισκόπηση/Πτήσεις/…). */
export function BottomNav({ active, onNavigate, onCreateTrip, accountActive, onAccountTap }: BottomNavProps) {
  return (
    <nav className={styles.bar}>
      <button type="button" className={styles.item} data-active={active === 'home'} onClick={() => onNavigate('home')}>
        <HomeIcon size={20} />
        Αρχική
      </button>
      <button type="button" className={styles.item} data-active={active === 'search'} onClick={() => onNavigate('search')}>
        <SearchIcon size={20} />
        Αναζήτηση
      </button>
      <button type="button" className={styles.createButton} onClick={onCreateTrip} aria-label="Νέο ταξίδι">
        +
      </button>
      <button type="button" className={styles.item} data-active={accountActive} onClick={onAccountTap}>
        <UserIcon size={20} />
        Λογαριασμός
      </button>
    </nav>
  );
}
