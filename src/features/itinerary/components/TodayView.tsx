import { formatDateShort, nowTimeStr, todayStr } from '../../../shared/lib/dateFormat';
import { EmptyState } from '../../../shared/components/EmptyState';
import { autoPulledEntryMeta } from '../lib/autoPulledEntries';
import { computeToday, type TodayItem } from '../lib/computeToday';
import type { AutoPulledEntry } from '../types';
import { AutoPulledEntryCard } from './AutoPulledEntryCard';
import { StopCard } from './StopCard';
import type { Trip } from '../../trips/types';
import type { ItineraryStop } from '../types';
import styles from './TodayView.module.css';

interface TodayViewProps {
  trip: Trip;
  onOpenStop: (stop: ItineraryStop) => void;
  onOpenAutoPulledEntry: (entry: AutoPulledEntry) => void;
}

function TodayItemCard({
  item,
  trip,
  onOpenStop,
  onOpenAutoPulledEntry,
}: {
  item: TodayItem;
  trip: Trip;
  onOpenStop: (stop: ItineraryStop) => void;
  onOpenAutoPulledEntry: (entry: AutoPulledEntry) => void;
}) {
  if (item.data.kind === 'stop') {
    return <StopCard stop={item.data.stop} travelers={trip.travelers} onOpen={onOpenStop} />;
  }
  return (
    <AutoPulledEntryCard
      entry={item.data.entry}
      meta={autoPulledEntryMeta(item.data.entry, trip.flights, trip.stays)}
      onOpen={onOpenAutoPulledEntry}
    />
  );
}

/**
 * Today is a read-only view onto the same itinerary data the Plan tab
 * edits — nothing here is stored separately. Recomputed from computeToday()
 * on every render, so it's always in sync with whatever's saved: add,
 * edit, or delete a stop from Plan and Today reflects it immediately.
 */
export function TodayView({ trip, onOpenStop, onOpenAutoPulledEntry }: TodayViewProps) {
  const today = todayStr();
  const report = computeToday({ date: today, stops: trip.itineraryStops, flights: trip.flights, stays: trip.stays, nowTime: nowTimeStr() });
  // Not every day of a trip necessarily sits inside a leg (a gap between
  // legs, or before/after any leg is defined) — the banner only appears
  // when today's date genuinely falls within one, never a guessed default.
  const currentLeg = trip.legs.find((leg) => today >= leg.startDate && today <= leg.endDate);

  const isEmpty = report.allDayStops.length === 0 && report.completed.length === 0 && !report.highlight && report.later.length === 0;

  return (
    <div className={styles.wrapper}>
      {currentLeg && (
        <div className={styles.legBanner}>
          <span className={styles.legEyebrow}>Current leg</span>
          <span className={styles.legName}>
            <span className={styles.legPill}>{currentLeg.city.toUpperCase() || 'TRIP'}</span>
            {currentLeg.city}
            {currentLeg.country && `, ${currentLeg.country}`}
          </span>
        </div>
      )}
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
              <TodayItemCard key={item.id} item={item} trip={trip} onOpenStop={onOpenStop} onOpenAutoPulledEntry={onOpenAutoPulledEntry} />
            ))}
          </div>
        </div>
      )}

      {report.highlight && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>{report.highlightStatus === 'current' ? 'Now' : 'Up next'}</div>
          <TodayItemCard item={report.highlight} trip={trip} onOpenStop={onOpenStop} onOpenAutoPulledEntry={onOpenAutoPulledEntry} />
        </div>
      )}

      {report.later.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>Later today</div>
          {report.later.map((item) => (
            <TodayItemCard key={item.id} item={item} trip={trip} onOpenStop={onOpenStop} onOpenAutoPulledEntry={onOpenAutoPulledEntry} />
          ))}
        </div>
      )}
    </div>
  );
}
