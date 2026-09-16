import { GearIcon, SearchIcon } from '../shared/components/icons';
import styles from './MoreScreen.module.css';

interface MoreScreenProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}

/**
 * Mobile's 5th bottom-nav destination — Search and Settings are still real,
 * reachable functionality (per the approved nav), just not primary-nav-level
 * items anymore; this is the menu that surfaces them instead of dropping
 * either one.
 */
export function MoreScreen({ onOpenSearch, onOpenSettings }: MoreScreenProps) {
  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>More</h1>
      <div className={styles.group}>
        <button type="button" className={styles.row} onClick={onOpenSearch}>
          <SearchIcon size={18} />
          Search
          <span className={styles.chevron}>›</span>
        </button>
        <button type="button" className={styles.row} onClick={onOpenSettings}>
          <GearIcon size={18} />
          Settings
          <span className={styles.chevron}>›</span>
        </button>
      </div>
    </div>
  );
}
