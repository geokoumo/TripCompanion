import { FLIGHT_STATUSES } from '../../../config/constants';
import { formatDateShort, formatDateNoYear, todayStr } from '../../../shared/lib/dateFormat';
import { daysBetween } from '../../../shared/lib/dateFormat';
import type { Trip, TripTab } from '../types';
import { getTripStatus } from '../types';
import styles from './OverviewTab.module.css';

function statusLabel(status: string): string {
  return FLIGHT_STATUSES.find((s) => s.id === status)?.label ?? status;
}

interface OverviewTabProps {
  trip: Trip;
  onTabChange: (tab: TripTab) => void;
}

export function OverviewTab({ trip, onTabChange }: OverviewTabProps) {
  const status = getTripStatus(trip);
  const today = todayStr();

  const sortedFlights = [...trip.flights].sort((a, b) => (a.depDate + a.depTime).localeCompare(b.depDate + b.depTime));
  const nextFlight = sortedFlights.find((f) => f.depDate + f.depTime >= today) ?? sortedFlights[0];

  const activeStay = trip.stays.find((s) => s.checkinDate <= today && s.checkoutDate >= today);
  const sortedStays = [...trip.stays].sort((a, b) => (a.checkinDate + a.checkinTime).localeCompare(b.checkinDate + b.checkinTime));
  const stayToShow = activeStay ?? sortedStays[0];

  const sortedStops = [...trip.itineraryStops].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const todaysStops = sortedStops.filter((s) => s.date === today);
  const nextStop = sortedStops.find((s) => s.date + s.time >= today) ?? sortedStops[0];

  return (
    <div className={styles.wrapper}>
      {status === 'upcoming' && (
        <div className={styles.countdownCard}>
          <div className={styles.countdownLabel}>Αναχώρηση σε</div>
          <div className={styles.countdownValue}>{daysBetween(today, trip.startDate)} μέρες</div>
          <div className={styles.countdownDates}>
            {formatDateShort(trip.startDate)} → {formatDateShort(trip.endDate)}
          </div>
        </div>
      )}

      {nextFlight ? (
        <div className={styles.snapshotCard} data-tone="rust">
          <div className={styles.snapshotLabel}>Επόμενη πτήση</div>
          <div className={styles.snapshotTitle}>
            {nextFlight.airline} {nextFlight.flightNumber} · {nextFlight.depAirport} → {nextFlight.arrAirport}
          </div>
          <div className={styles.snapshotSubtitle}>
            {formatDateNoYear(nextFlight.depDate)} · {nextFlight.depTime} · {statusLabel(nextFlight.status).toLowerCase()}
          </div>
        </div>
      ) : (
        <button type="button" className={styles.emptyNote} onClick={() => onTabChange('flights')}>
          Δεν έχουν προστεθεί πτήσεις ακόμα.
        </button>
      )}

      {stayToShow ? (
        <div className={styles.snapshotCard} data-tone="teal">
          <div className={styles.snapshotLabel}>Διαμονή</div>
          <div className={styles.snapshotTitle}>{stayToShow.name}</div>
          <div className={styles.snapshotSubtitle}>
            {formatDateNoYear(stayToShow.checkinDate)} {stayToShow.checkinTime} → {formatDateNoYear(stayToShow.checkoutDate)} {stayToShow.checkoutTime}
          </div>
        </div>
      ) : (
        <button type="button" className={styles.emptyNote} onClick={() => onTabChange('stays')}>
          Δεν έχει προστεθεί διαμονή ακόμα.
        </button>
      )}

      {status === 'ongoing' ? (
        todaysStops.length > 0 ? (
          <div className={styles.snapshotCard} data-tone="brass">
            <div className={styles.snapshotLabel}>Σήμερα</div>
            {todaysStops.map((stop) => (
              <div key={stop.id}>
                <div className={styles.snapshotTitle}>{stop.title}</div>
                <div className={styles.snapshotSubtitle}>
                  {stop.time} {stop.location ? `· ${stop.location}` : ''}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <button type="button" className={styles.emptyNote} onClick={() => onTabChange('itinerary')}>
            Δεν έχουν προγραμματιστεί στάσεις για σήμερα.
          </button>
        )
      ) : nextStop ? (
        <div className={styles.snapshotCard} data-tone="brass">
          <div className={styles.snapshotLabel}>Πρώτη στάση</div>
          <div className={styles.snapshotTitle}>{nextStop.title}</div>
          <div className={styles.snapshotSubtitle}>
            {formatDateNoYear(nextStop.date)} · {nextStop.time} {nextStop.location ? `· ${nextStop.location}` : ''}
          </div>
        </div>
      ) : (
        <button type="button" className={styles.emptyNote} onClick={() => onTabChange('itinerary')}>
          Δεν έχει προστεθεί πρόγραμμα ακόμα.
        </button>
      )}
    </div>
  );
}
