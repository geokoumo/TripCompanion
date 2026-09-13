import { AIRPORT_CITY_NAMES } from '../../../config/constants';
import { formatDateNoYear } from '../../../shared/lib/dateFormat';
import { arrivesNextDay, computeFlightDuration } from '../lib/duration';
import type { Flight } from '../types';
import styles from './FlightJourneyHeader.module.css';

/**
 * The two-airport journey layout (codes, times, dates, duration) shared by
 * FlightCard (the Flights list) and FlightDetailView — one visual system
 * for "this flight" wherever it's shown, instead of the list using a
 * journey layout and the detail view falling back to generic label/value
 * rows for the same information.
 */
export function FlightJourneyHeader({ flight }: { flight: Pick<Flight, 'depAirport' | 'depDate' | 'depTime' | 'arrAirport' | 'arrDate' | 'arrTime'> }) {
  const duration = computeFlightDuration(flight);
  const nextDay = arrivesNextDay(flight.depDate, flight.arrDate);

  return (
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
        {nextDay && <div className={styles.nextDay}>+1 day</div>}
      </div>
      <div className={styles.alignRight}>
        <div className={styles.airportCode}>{flight.arrAirport}</div>
        <div className={styles.time}>{flight.arrTime}</div>
        <div className={styles.dateCity}>
          {formatDateNoYear(flight.arrDate)} · {AIRPORT_CITY_NAMES[flight.arrAirport] ?? flight.arrAirport}
        </div>
      </div>
    </div>
  );
}
