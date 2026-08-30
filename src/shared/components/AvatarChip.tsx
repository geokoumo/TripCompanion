import type { TravelerAvatarColor } from '../../config/constants';
import { initialsOf } from '../../features/travelers/lib/avatarColors';
import styles from './AvatarChip.module.css';

interface AvatarChipProps {
  name: string;
  color: TravelerAvatarColor;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarChip({ name, color, size = 'md' }: AvatarChipProps) {
  return (
    <span className={styles.avatar} data-color={color} data-size={size} title={name}>
      {initialsOf(name)}
    </span>
  );
}

export function AvatarRow({ travelers }: { travelers: { id?: string; name: string; avatarColor: TravelerAvatarColor }[] }) {
  if (travelers.length === 0) return null;
  return (
    <span className={styles.row}>
      {travelers.map((t, i) => (
        <AvatarChip key={t.id ?? `${t.name}-${i}`} name={t.name} color={t.avatarColor} size="sm" />
      ))}
    </span>
  );
}
