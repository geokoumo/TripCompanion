import { memo } from 'react';
import { AIRPORT_CITY_NAMES, FLIGHT_STATUSES } from '../../../config/constants';
import { StampBadge } from '../../../shared/components/StampBadge';
import { formatDateNoYear } from '../../../shared/lib/dateFormat';
import { computeFlightDuration } from '../lib/duration';
import type { Flight } from '../types';
import styles from './FlightCard.module.css';

const STATUS_TONE: Record<string, 'teal' | 'rust' | 'gray'> = {
  scheduled: 'teal',
  delayed: 'rust',
  cancelled: 'rust',
  landed: 'gray',
};

function FlightCardComponent({ flight, onOpen }: { flight: Flight; onOpen: (flight: Flight) => void }) {
  const duration = computeFlightDuration(flight);
  const statusLabel = FLIGHT_STATUSES.find((s) => s.id === flight.status)?.label ?? flight.status;
  const nextDay = flight.arrDate > flight.depDate;
  const isCancelled = flight.status === 'cancelled';

  return (
    <div className={styles.card} data-cancelled={isCancelled} onClick={() => onOpen(flight)}>
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
          {flight.terminal && (
            <span className={styles.footerItem}>
              <span className={styles.footerLabel}>Τερμ.</span>
              {flight.terminal}
            </span>
          )}
          {flight.gate && (
            <span className={styles.footerItem}>
              <span className={styles.footerLabel}>Gate</span>
              {flight.gate}
            </span>
          )}
          {flight.bookingRef && (
            <span className={styles.footerItem} data-align="end">
              <span className={styles.footerLabel}>Κωδ.</span>
              {flight.bookingRef}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export const FlightCard = memo(FlightCardComponent);
