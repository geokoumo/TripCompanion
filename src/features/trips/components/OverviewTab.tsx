import { FLIGHT_STATUSES } from '../../../config/constants';
import { EmptyState } from '../../../shared/components/EmptyState';
import { formatDateShort, formatDateNoYear, todayStr, daysBetween } from '../../../shared/lib/dateFormat';
import { getTripDateRange } from '../lib/dateRange';
import { getTripStatus, type Trip } from '../types';
import { StatGrid } from './StatGrid';
import styles from './OverviewTab.module.css';

function statusLabel(status: string): string {
  return FLIGHT_STATUSES.find((s) => s.id === status)?.label ?? status;
}

export function OverviewTab({ trip }: { trip: Trip }) {
  const range = getTripDateRange(trip.legs, trip.flights);
  const status = getTripStatus(range);
  const today = todayStr();

  const sortedFlights = [...trip.flights].sort((a, b) => (a.depDate + a.depTime).localeCompare(b.depDate + b.depTime));
  const nextFlight = sortedFlights.find((f) => f.depDate + f.depTime >= today) ?? sortedFlights[sortedFlights.length - 1];

  const activeStay = trip.stays.find((s) => s.checkinDate <= today && s.checkoutDate >= today);
  const sortedStays = [...trip.stays].sort((a, b) => (a.checkinDate + a.checkinTime).localeCompare(b.checkinDate + b.checkinTime));
  const stayToShow = activeStay ?? sortedStays.find((s) => s.checkinDate >= today) ?? sortedStays[sortedStays.length - 1];

  const sortedStops = [...trip.itineraryStops].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const nextStop = sortedStops.find((s) => s.date + s.time >= today) ?? sortedStops[0];

  const nothingYet = trip.flights.length === 0 && trip.stays.length === 0 && trip.itineraryStops.length === 0;

  let countdownKicker: string | null = null;
  let countdownValue: string | null = null;
  let countdownTone: 'rust' | 'teal' = 'rust';
  let showLoggedStamp = false;
  if (range && status !== 'completed') {
    if (status === 'upcoming') {
      const days = daysBetween(today, range.startDate);
      countdownKicker = 'Αναχώρηση σε';
      countdownValue = days === 1 ? '1 μέρα' : `${days} μέρες`;
    } else {
      // 'today' and 'ongoing' share the same "Day X of N" framing.
      const totalDays = daysBetween(range.startDate, range.endDate) + 1;
      const currentDay = Math.min(Math.max(daysBetween(range.startDate, today) + 1, 1), totalDays);
      countdownKicker = 'Σε εξέλιξη';
      countdownValue = `Ημέρα ${currentDay} από ${totalDays}`;
      countdownTone = 'teal';
      showLoggedStamp = true;
    }
  }

  if (nothingYet) {
    return (
      <div className={styles.wrapper}>
        {trip.description && <p className={styles.description}>{trip.description}</p>}
        <StatGrid trip={trip} />
        <EmptyState headline="Τίποτα ακόμα" body="Πρόσθεσε πτήσεις ή διαμονή και θα εμφανιστούν εδώ." />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {trip.description && <p className={styles.description}>{trip.description}</p>}
      <StatGrid trip={trip} />

      {countdownKicker && range && (
        <div className={styles.countdownCard} data-tone={countdownTone}>
          {showLoggedStamp && <div className={styles.loggedStamp}>Trip logged</div>}
          <div className={styles.countdownLabel}>{countdownKicker}</div>
          <div className={styles.countdownValue}>{countdownValue}</div>
          <div className={styles.countdownDates}>
            {formatDateShort(range.startDate)} → {formatDateShort(range.endDate)}
          </div>
        </div>
      )}

      {nextFlight && (
        <div className={styles.snapshotCard} data-tone="rust">
          <div className={styles.snapshotLabel}>Επόμενη πτήση · {nextFlight.flightNumber}</div>
          <div className={styles.flightRoute}>
            <div>
              <div className={styles.flightAirportCode}>{nextFlight.depAirport}</div>
              <div className={styles.flightTime}>{nextFlight.depTime}</div>
            </div>
            <div className={styles.flightAirportCodeRight}>
              <div className={styles.flightAirportCode}>{nextFlight.arrAirport}</div>
              <div className={styles.flightTime}>{nextFlight.arrTime}</div>
            </div>
          </div>
          <div className={styles.snapshotSubtitle}>
            {nextFlight.airline} · {formatDateNoYear(nextFlight.depDate)} · {statusLabel(nextFlight.status).toLowerCase()}
          </div>
        </div>
      )}

      {stayToShow && (
        <div className={styles.snapshotCard} data-tone="teal">
          <div className={styles.snapshotLabel}>Διαμονή</div>
          <div className={styles.snapshotTitle}>{stayToShow.name}</div>
          <div className={styles.snapshotSubtitle}>
            {formatDateNoYear(stayToShow.checkinDate)} {stayToShow.checkinTime} → {formatDateNoYear(stayToShow.checkoutDate)} {stayToShow.checkoutTime}
          </div>
        </div>
      )}

      {nextStop && (
        <div className={styles.snapshotCard}>
          <div className={styles.snapshotLabel}>{status === 'ongoing' || status === 'today' ? 'Επόμενη στάση' : 'Πρώτη στάση'}</div>
          <div className={styles.snapshotTitle}>{nextStop.title}</div>
          <div className={styles.snapshotSubtitle}>
            {formatDateNoYear(nextStop.date)} · {nextStop.time} {nextStop.location ? `· ${nextStop.location}` : ''}
          </div>
        </div>
      )}
    </div>
  );
}
