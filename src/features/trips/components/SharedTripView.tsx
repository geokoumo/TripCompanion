import { LoadingScreen } from '../../../app/LoadingScreen';
import { useTrip } from '../hooks/useTrip';
import { expenseAmountInHome } from '../../budget/lib/currency';
import { computeFlightDuration } from '../../flights/lib/duration';
import { formatDateNoYear, formatDateShort } from '../../../shared/lib/dateFormat';
import { getTripDateRange } from '../lib/dateRange';
import { TRIP_TABS, type Trip, type TripTab } from '../types';
import styles from './SharedTripView.module.css';

const TAB_LABELS: Record<TripTab, string> = {
  overview: 'Overview',
  flights: 'Flights',
  stays: 'Stays',
  itinerary: 'Itinerary',
  budget: 'Budget',
  checklist: 'Packing',
};

function BudgetReadOnly({ trip }: { trip: Trip }) {
  const spentByCategory = new Map<string, number>();
  let total = 0;
  for (const expense of trip.expenses) {
    const amountHome = expenseAmountInHome(expense, trip.homeCurrency);
    if (amountHome === null) continue;
    total += amountHome;
    spentByCategory.set(expense.categoryId, (spentByCategory.get(expense.categoryId) ?? 0) + amountHome);
  }
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-budget-total)', fontWeight: 600, marginBottom: 12 }}>
        {total.toFixed(2)} {trip.homeCurrency}
      </div>
      {trip.budgetCategories.map((category) => {
        const spent = spentByCategory.get(category.id) ?? 0;
        const pct = total > 0 ? (spent / total) * 100 : 0;
        return (
          <div key={category.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>{category.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {spent.toFixed(2)} {trip.homeCurrency}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--color-bg)', overflow: 'hidden', marginTop: 4 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `var(--color-${category.color})` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChecklistReadOnly({ trip }: { trip: Trip }) {
  return (
    <>
      {trip.travelers.map((traveler) => {
        const items = trip.checklistItems.filter((i) => i.travelerId === traveler.id);
        if (items.length === 0) return null;
        return (
          <div key={traveler.id} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{traveler.name}</div>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: item.done ? 'var(--color-text-faint)' : 'var(--color-text)' }}>
                <span style={{ textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</span>
                {item.quantity > 1 && <span style={{ fontFamily: 'var(--font-mono)' }}>×{item.quantity}</span>}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

interface TimelineRow {
  key: string;
  sortKey: string;
  tone: 'rust' | 'teal' | 'brass';
  label: string;
  title: string;
  subtitle: string;
}

// A single chronological rollup — flights, stays and itinerary stops
// interleaved by date/time — rather than the owner's own tabbed views. A
// recipient reads one continuous feed, not three separate lists.
function buildTimeline(trip: Trip, includedTabs: Set<TripTab>): TimelineRow[] {
  const rows: TimelineRow[] = [];

  if (includedTabs.has('flights')) {
    for (const f of trip.flights) {
      const duration = computeFlightDuration(f);
      rows.push({
        key: `flight-${f.id}`,
        sortKey: f.depDate + f.depTime,
        tone: 'rust',
        label: 'Flight',
        title: `${f.flightNumber} · ${f.depAirport} → ${f.arrAirport}`,
        subtitle: `${formatDateNoYear(f.depDate)} · ${f.depTime} → ${f.arrTime}${duration ? ` (${duration.label})` : ''}`,
      });
    }
  }

  if (includedTabs.has('stays')) {
    for (const s of trip.stays) {
      rows.push({
        key: `stay-${s.id}`,
        sortKey: s.checkinDate + s.checkinTime,
        tone: 'teal',
        label: 'Stay',
        title: s.name,
        subtitle: `${formatDateNoYear(s.checkinDate)} → ${formatDateNoYear(s.checkoutDate)}`,
      });
    }
  }

  if (includedTabs.has('itinerary')) {
    for (const stop of trip.itineraryStops) {
      rows.push({
        key: `stop-${stop.id}`,
        sortKey: stop.date + (stop.time ?? ''),
        tone: 'brass',
        label: 'Stop',
        title: stop.title,
        subtitle: stop.allDay ? `${formatDateNoYear(stop.date)} · All day` : `${formatDateNoYear(stop.date)} · ${stop.time}`,
      });
    }
  }

  return rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export function SharedTripView({ tripId, onExit }: { tripId: string; onExit: () => void }) {
  const { trip, loading } = useTrip(tripId);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!trip || !trip.shareSettings.enabled) {
    return (
      <div className={styles.screen}>
        <div className={styles.header}>
          <button type="button" className={styles.exitLink} onClick={onExit}>
            Exit
          </button>
          <p>This link is no longer available.</p>
        </div>
      </div>
    );
  }

  const range = getTripDateRange(trip.legs, trip.flights);
  const included = new Set(trip.shareSettings.includedTabs);
  const timeline = buildTimeline(trip, included);

  return (
    <div className={styles.screen}>
      <div className={styles.banner}>Shared view · read-only</div>
      <div className={styles.header}>
        <button type="button" className={styles.exitLink} onClick={onExit}>
          Exit
        </button>
        <div className={styles.title}>{trip.title}</div>
        {range && (
          <div className={styles.dates}>
            {formatDateShort(range.startDate)} – {formatDateShort(range.endDate)}
          </div>
        )}
        <div className={styles.tabChips}>
          {TRIP_TABS.filter((t) => included.has(t)).map((tab) => (
            <span key={tab} className={styles.tabChip}>
              {TAB_LABELS[tab]}
            </span>
          ))}
        </div>
      </div>

      {timeline.length > 0 && (
        <div className={styles.section}>
          {timeline.map((row) => (
            <div key={row.key} className={styles.timelineRow} data-tone={row.tone}>
              <div className={styles.timelineLabel}>{row.label}</div>
              <div className={styles.timelineTitle}>{row.title}</div>
              <div className={styles.timelineSubtitle}>{row.subtitle}</div>
            </div>
          ))}
        </div>
      )}

      {included.has('budget') && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Budget</div>
          <BudgetReadOnly trip={trip} />
        </div>
      )}

      {included.has('checklist') && trip.checklistItems.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Packing</div>
          <ChecklistReadOnly trip={trip} />
        </div>
      )}
    </div>
  );
}
