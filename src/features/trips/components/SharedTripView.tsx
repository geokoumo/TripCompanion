import { useTripsContext } from '../../../app/providers/TripsProvider';
import { FlightCard } from '../../flights/components/FlightCard';
import { StayCard } from '../../stays/components/StayCard';
import { expenseAmountInHome } from '../../budget/lib/currency';
import { formatDateNoYear, formatDateShort } from '../../../shared/lib/dateFormat';
import { getTripDateRange } from '../lib/dateRange';
import { TRIP_TABS, type Trip, type TripTab } from '../types';
import styles from './SharedTripView.module.css';

const TAB_LABELS: Record<TripTab, string> = {
  overview: 'Επισκόπηση',
  flights: 'Πτήσεις',
  stays: 'Διαμονή',
  itinerary: 'Πρόγραμμα',
  budget: 'Budget',
  checklist: 'Βαλίτσα',
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

function ItineraryReadOnly({ trip }: { trip: Trip }) {
  const sorted = [...trip.itineraryStops].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return (
    <>
      {sorted.map((stop) => (
        <div key={stop.id} style={{ borderLeft: '3px solid var(--color-brass)', padding: '8px 12px', marginBottom: 8, background: 'var(--color-surface-raised)', borderRadius: 8 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-text-muted)' }}>
            {formatDateNoYear(stop.date)} · {stop.time}
          </div>
          <div style={{ fontWeight: 600 }}>{stop.title}</div>
        </div>
      ))}
    </>
  );
}

export function SharedTripView({ tripId, onExit }: { tripId: string; onExit: () => void }) {
  const { trips } = useTripsContext();
  const trip = trips.find((t) => t.id === tripId);

  if (!trip || !trip.shareSettings.enabled) {
    return (
      <div className={styles.screen}>
        <div className={styles.header}>
          <button type="button" className={styles.exitLink} onClick={onExit}>
            Έξοδος
          </button>
          <p>Αυτός ο σύνδεσμος δεν είναι πλέον διαθέσιμος.</p>
        </div>
      </div>
    );
  }

  const range = getTripDateRange(trip.legs, trip.flights);
  const included = new Set(trip.shareSettings.includedTabs);

  return (
    <div className={styles.screen}>
      <div className={styles.banner}>Κοινόχρηστη προβολή · μόνο ανάγνωση</div>
      <div className={styles.header}>
        <button type="button" className={styles.exitLink} onClick={onExit}>
          Έξοδος
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

      {included.has('flights') && trip.flights.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Πτήσεις</div>
          {[...trip.flights]
            .sort((a, b) => (a.depDate + a.depTime).localeCompare(b.depDate + b.depTime))
            .map((f) => (
              <FlightCard key={f.id} flight={f} onOpen={() => {}} />
            ))}
        </div>
      )}

      {included.has('stays') && trip.stays.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Διαμονή</div>
          {trip.stays.map((s) => (
            <StayCard key={s.id} stay={s} overlapping={false} onOpen={() => {}} />
          ))}
        </div>
      )}

      {included.has('itinerary') && trip.itineraryStops.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Πρόγραμμα</div>
          <ItineraryReadOnly trip={trip} />
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
          <div className={styles.sectionTitle}>Βαλίτσα</div>
          <ChecklistReadOnly trip={trip} />
        </div>
      )}
    </div>
  );
}
