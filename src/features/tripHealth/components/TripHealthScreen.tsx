import { useMemo } from 'react';
import { Button } from '../../../shared/components/Button';
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
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Back to Overview">
          ‹
        </button>
        <span className={styles.title}>Trip Health</span>
      </div>

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
                <div key={warning.id} className={styles.warningCard}>
                  <div className={styles.warningTitleRow}>
                    <span className={styles.warningIcon} role="img" aria-label="Warning">
                      ⚠
                    </span>
                    <span>{warning.title}</span>
                  </div>
                  <p className={styles.warningDescription}>{warning.description}</p>
                  <Button variant="primary" onClick={() => onNavigate(warning.fixTarget)}>
                    {warning.fixLabel}
                  </Button>
                </div>
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
