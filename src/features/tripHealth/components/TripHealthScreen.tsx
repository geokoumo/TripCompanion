import { useMemo } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { WarningCard } from '../../../shared/components/WarningCard';
import { todayStr } from '../../../shared/lib/dateFormat';
import { computeTripHealth } from '../lib/computeTripHealth';
import type { TripHealthFixTarget } from '../types';
import type { Trip } from '../../trips/types';
import styles from './TripHealthScreen.module.css';

interface TripHealthScreenProps {
  trip: Trip;
  onBack: () => void;
  onNavigate: (target: TripHealthFixTarget) => void;
}

export function TripHealthScreen({ trip, onBack, onNavigate }: TripHealthScreenProps) {
  const { warnings, passedChecks } = useMemo(() => computeTripHealth(trip, todayStr()), [trip]);
  const allClear = warnings.length === 0;

  return (
    <div>
      <PageHeader title="Trip Health" onBack={onBack} backLabel="Back to Overview" />

      <div className={styles.content}>
        <div className={styles.summaryCard} data-tone={allClear ? 'teal' : 'rust'}>
          <span className={styles.summaryDot} />
          <div>
            <div className={styles.summaryTitle}>{allClear ? 'All checks passed' : `${warnings.length} Deterministic Warning${warnings.length === 1 ? '' : 's'}`}</div>
            <div className={styles.summarySubtitle}>Validated against saved trip data and rules.</div>
          </div>
        </div>

        {!allClear && (
          <>
            <div className={styles.eyebrow}>Active Warnings</div>
            <div className={styles.warningList}>
              {warnings.map((warning) => (
                <WarningCard
                  key={warning.id}
                  title={warning.title}
                  description={warning.description}
                  actionLabel={warning.fixLabel}
                  onAction={() => onNavigate(warning.fixTarget)}
                />
              ))}
            </div>
          </>
        )}

        {passedChecks.length > 0 && (
          <div className={styles.passedCard}>
            <div className={styles.passedTitle}>Passed Checks</div>
            <ul className={styles.passedList}>
              {passedChecks.map((check) => (
                <li key={check.id} className={styles.passedItem}>
                  <span className={styles.passedDot} aria-hidden="true" />
                  <span>{check.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
