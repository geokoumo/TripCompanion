import { Card } from '../../../shared/components/Card';
import { IconCircle } from '../../../shared/components/IconCircle';
import { AlertTriangleIcon, CheckCircleIcon } from '../../../shared/components/icons';
import type { TripHealthWarning } from '../types';
import styles from './TripHealthBanner.module.css';

interface TripHealthBannerProps {
  warnings: TripHealthWarning[];
  onOpen: () => void;
}

/**
 * Overview's always-present entry point into Trip Health — one of the
 * product's four primary pillars ("what needs my attention?"), so it stays
 * visible and checkable even when everything currently passes, rather than
 * only appearing as a transient error banner.
 */
export function TripHealthBanner({ warnings, onOpen }: TripHealthBannerProps) {
  const allClear = warnings.length === 0;
  const summary = allClear
    ? 'All checks passed.'
    : warnings.length === 1
      ? warnings[0]!.title
      : warnings.map((w) => w.title).join(', ');

  return (
    <Card className={styles.card} onClick={onOpen} data-tone={allClear ? 'teal' : 'rust'}>
      <IconCircle tone={allClear ? 'teal' : 'rust'} size={40}>
        {allClear ? <CheckCircleIcon size={20} /> : <AlertTriangleIcon size={20} />}
      </IconCircle>
      <span className={styles.body}>
        <span className={styles.title}>{allClear ? 'Trip Health' : `${warnings.length} Trip Health issue${warnings.length === 1 ? '' : 's'}`}</span>
        <span className={styles.subtitle}>{summary}</span>
      </span>
      <span className={styles.chevron} aria-hidden="true">
        ›
      </span>
    </Card>
  );
}
