import { AvatarChip } from '../../../shared/components/AvatarChip';
import type { Traveler } from '../../travelers/types';
import styles from './ChecklistTab.module.css';

interface TravelerTabsProps {
  travelers: Traveler[];
  activeId: string;
  onChange: (id: string) => void;
}

export function TravelerTabs({ travelers, activeId, onChange }: TravelerTabsProps) {
  return (
    <div className={styles.tabs}>
      {travelers.map((traveler) => (
        <button key={traveler.id} type="button" className={styles.tab} data-active={traveler.id === activeId} onClick={() => onChange(traveler.id)}>
          <AvatarChip name={traveler.name} color={traveler.avatarColor} size="sm" />
          {traveler.name}
        </button>
      ))}
    </div>
  );
}
