import { formatDateShort, nowTimeStr, todayStr } from '../../../shared/lib/dateFormat';
import { EmptyState } from '../../../shared/components/EmptyState';
import { computeToday, type TodayItem } from '../lib/computeToday';
import { AutoPulledEntryCard } from './AutoPulledEntryCard';
import { StopCard } from './StopCard';
import type { Trip } from '../../trips/types';
import type { ItineraryStop } from '../types';
import styles from './TodayView.module.css';

interface TodayViewProps {
  trip: Trip;
  onOpenStop: (stop: ItineraryStop) => void;
}

function TodayItemCard({ item, travelers, onOpenStop }: { item: TodayItem; travelers: Trip['travelers']; onOpenStop: (stop: ItineraryStop) => void }) {
  if (item.data.kind === 'stop') {
    return <StopCard stop={item.data.stop} travelers={travelers} onOpen={onOpenStop} />;
  }
  return <AutoPulledEntryCard entry={item.data.entry} />;
}

/**
 * Today is a read-only view onto the same itinerary data the Plan tab
 * edits — nothing here is stored separately. Recomputed from computeToday()
 * on every render, so it's always in sync with whatever's saved: add,
 * edit, or delete a stop from Plan and Today reflects it immediately.
 */
export function TodayView({ trip, onOpenStop }: TodayViewProps) {
  const today = todayStr();
  const report = computeToday({ date: today, stops: trip.itineraryStops, flights: trip.flights, stays: trip.stays, nowTime: nowTimeStr() });

  const isEmpty = report.allDayStops.length === 0 && report.completed.length === 0 && !report.highlight && report.later.length === 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.dateLabel}>{formatDateShort(today)}</div>

      {isEmpty && <EmptyState headline="Nothing today" body="Add a stop from the Plan tab and it'll show up here." />}

      {report.allDayStops.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>All day</div>
          {report.allDayStops.map((stop) => (
            <StopCard key={stop.id} stop={stop} travelers={trip.travelers} onOpen={onOpenStop} />
          ))}
        </div>
      )}

      {report.completed.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>Completed</div>
          <div className={styles.completedGroup}>
            {report.completed.map((item) => (
              <TodayItemCard key={item.id} item={item} travelers={trip.travelers} onOpenStop={onOpenStop} />
            ))}
          </div>
        </div>
      )}

      {report.highlight && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>{report.highlightStatus === 'current' ? 'Now' : 'Up next'}</div>
          <TodayItemCard item={report.highlight} travelers={trip.travelers} onOpenStop={onOpenStop} />
        </div>
      )}

      {report.later.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>Later today</div>
          {report.later.map((item) => (
            <TodayItemCard key={item.id} item={item} travelers={trip.travelers} onOpenStop={onOpenStop} />
          ))}
        </div>
      )}
    </div>
  );
}
