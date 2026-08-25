import { FLIGHT_STATUSES } from '../../../config/constants';
import { EmptyState } from '../../../shared/components/EmptyState';
import { formatDateShort, formatDateNoYear, todayStr, daysBetween } from '../../../shared/lib/dateFormat';
import { getTripDateRange } from '../lib/dateRange';
import { getTripStatus, type Trip } from '../types';
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
  if (range && status !== 'completed') {
    if (status === 'upcoming') {
      const days = daysBetween(today, range.startDate);
      countdownKicker = 'Αναχώρηση σε';
      countdownValue = days === 1 ? '1 μέρα' : `${days} μέρες`;
    } else if (status === 'today') {
      countdownKicker = 'Ξεκινά';
      countdownValue = 'σήμερα';
    } else {
      const daysSince = daysBetween(range.startDate, today);
      countdownKicker = 'Ξεκίνησε';
      countdownValue = daysSince === 1 ? '1 μέρα πριν' : `${daysSince} μέρες πριν`;
    }
  }

  if (nothingYet) {
    return (
      <div className={styles.wrapper}>
        <EmptyState headline="Τίποτα ακόμα" body="Πρόσθεσε πτήσεις ή διαμονή και θα εμφανιστούν εδώ." />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {countdownKicker && range && (
        <div className={styles.countdownCard}>
          <div className={styles.countdownLabel}>{countdownKicker}</div>
          <div className={styles.countdownValue}>{countdownValue}</div>
          <div className={styles.countdownDates}>
            {formatDateShort(range.startDate)} → {formatDateShort(range.endDate)}
          </div>
        </div>
      )}

      {nextFlight && (
        <div className={styles.snapshotCard} data-tone="rust">
          <div className={styles.flightSnapshotTop}>
            <div className={styles.snapshotLabel}>Επόμενη πτήση</div>
            <span className={styles.flightNumberChip}>{nextFlight.flightNumber}</span>
          </div>
          <div className={styles.flightRoute}>
            <div>
              <div className={styles.flightAirportCode}>{nextFlight.depAirport}</div>
              <div className={styles.flightTime}>{nextFlight.depTime}</div>
            </div>
            <div className={styles.flightRouteMiddle}>
              <div className={styles.flightRouteLine} />
              <span className={styles.flightRouteArrow} aria-hidden="true">
                ▶
              </span>
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
        <div className={styles.snapshotCard} data-tone="brass">
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
