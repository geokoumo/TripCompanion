import { GearIcon, HomeIcon, SearchIcon } from '../shared/components/icons';
import type { TopLevelTab } from '../shared/lib/useHashRoute';
import styles from './BottomNav.module.css';

interface BottomNavProps {
  active: TopLevelTab;
  onNavigate: (tab: TopLevelTab) => void;
  onCreateTrip: () => void;
  /** Settings is a full-screen overlay, not a routed screen — highlighted while it's open. */
  settingsActive: boolean;
  onSettingsTap: () => void;
}

/** App-shell-level primary navigation — unrelated to the in-trip tab bar (Overview/Flights/…). */
export function BottomNav({ active, onNavigate, onCreateTrip, settingsActive, onSettingsTap }: BottomNavProps) {
  return (
    <nav className={styles.bar}>
      <button type="button" className={styles.item} data-active={active === 'home'} onClick={() => onNavigate('home')}>
        <HomeIcon size={20} />
        Home
      </button>
      <button type="button" className={styles.item} data-active={active === 'search'} onClick={() => onNavigate('search')}>
        <SearchIcon size={20} />
        Search
      </button>
      <button type="button" className={styles.createButton} onClick={onCreateTrip} aria-label="New trip">
        +
      </button>
      <button type="button" className={styles.item} data-active={settingsActive} onClick={onSettingsTap}>
        <GearIcon size={20} />
        Settings
      </button>
    </nav>
  );
}
