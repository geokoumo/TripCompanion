import { AIRPORT_CITY_NAMES, FLIGHT_STATUSES } from '../../../config/constants';
import { StampBadge } from '../../../shared/components/StampBadge';
import { formatDateNoYear } from '../../../shared/lib/dateFormat';
import { computeFlightDuration } from '../lib/duration';
import type { Flight } from '../types';
import styles from './FlightCard.module.css';

const STATUS_TONE: Record<string, 'teal' | 'brass' | 'rust' | 'gray'> = {
  scheduled: 'teal',
  delayed: 'brass',
  cancelled: 'rust',
  landed: 'gray',
};

export function FlightCard({ flight, onOpen }: { flight: Flight; onOpen: () => void }) {
  const duration = computeFlightDuration(flight);
  const statusLabel = FLIGHT_STATUSES.find((s) => s.id === flight.status)?.label ?? flight.status;
  const nextDay = flight.arrDate > flight.depDate;

  return (
    <div className={styles.card} onClick={onOpen}>
      <div className={styles.topRow}>
        <span className={styles.airlineLine}>
          {flight.airline} · {flight.flightNumber}
        </span>
        <StampBadge tone={STATUS_TONE[flight.status] ?? 'gray'}>{statusLabel}</StampBadge>
      </div>
      <div className={styles.routeRow}>
        <div>
          <div className={styles.airportCode}>{flight.depAirport}</div>
          <div className={styles.time}>{flight.depTime}</div>
          <div className={styles.dateCity}>
            {formatDateNoYear(flight.depDate)} · {AIRPORT_CITY_NAMES[flight.depAirport] ?? flight.depAirport}
          </div>
        </div>
        <div className={styles.middle}>
          {duration && <div className={styles.duration}>{duration.label}</div>}
          <div className={styles.durationLine} />
          {nextDay && <div className={styles.nextDay}>+1 μέρα</div>}
        </div>
        <div className={styles.alignRight}>
          <div className={styles.airportCode}>{flight.arrAirport}</div>
          <div className={styles.time}>{flight.arrTime}</div>
          <div className={styles.dateCity}>
            {formatDateNoYear(flight.arrDate)} · {AIRPORT_CITY_NAMES[flight.arrAirport] ?? flight.arrAirport}
          </div>
        </div>
      </div>
      {(flight.terminal || flight.gate || flight.bookingRef) && (
        <div className={styles.footer}>
          {flight.terminal && <span>Τερμ. {flight.terminal}</span>}
          {flight.gate && <span>Πύλη {flight.gate}</span>}
          {flight.bookingRef && <span>{flight.bookingRef}</span>}
        </div>
      )}
    </div>
  );
}
