import type { DomainError } from './errors';
import type { Activity, Flight, Stay } from './schemas';
import { toComparableMs } from './lib/dateTime';
import { activitySpan, spansConflict, type TimeSpan } from './detectActivityOverlap';

/** A flight occupies its full real elapsed travel time — you can't be doing an itinerary activity while you're in the air. A proper [dep, arr) range, exactly like a duration-having activity. */
function flightSpan(flight: Pick<Flight, 'depDate' | 'depTime' | 'arrDate' | 'arrTime'>): TimeSpan | null {
  const start = toComparableMs(flight.depDate, flight.depTime);
  const end = toComparableMs(flight.arrDate, flight.arrTime);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return { start, end, isPoint: false };
}

/** A stay occupies only the exact check-in/check-out instants, not the whole stay — you're free to have activities during a multi-day stay, just not at the literal moment of checking in or out. Each instant is a point, exactly like a durationless activity. */
function stayPoints(stay: Pick<Stay, 'checkinDate' | 'checkinTime' | 'checkoutDate' | 'checkoutTime'>): TimeSpan[] {
  const points: TimeSpan[] = [];
  const checkin = toComparableMs(stay.checkinDate, stay.checkinTime);
  if (!Number.isNaN(checkin)) points.push({ start: checkin, end: checkin, isPoint: true });
  const checkout = toComparableMs(stay.checkoutDate, stay.checkoutTime);
  if (!Number.isNaN(checkout)) points.push({ start: checkout, end: checkout, isPoint: true });
  return points;
}

/**
 * Flags an activity that falls during a flight's real elapsed travel time, or
 * exactly at a stay's check-in/check-out instant (F-06) — a canonical,
 * domain-level rule so idea→stop assignment and booking→itinerary can't
 * bypass it the way they could when this was only a StopForm wheel-picker
 * warning. Uses the identical chronological span/point semantics as
 * detectActivityOverlap: touching boundaries never conflict (an activity
 * starting the instant a flight lands is fine), an all-day or timeless
 * candidate never participates, and a cross-midnight flight/activity is
 * compared as real elapsed time, not same-calendar-date matching.
 */
export function detectFlightStayOccupancyConflict(
  candidate: Pick<Activity, 'allDay' | 'date' | 'time' | 'durationMinutes'>,
  flights: Flight[],
  stays: Stay[],
): DomainError[] {
  const candidateSpan = activitySpan(candidate);
  if (!candidateSpan) return [];

  const errors: DomainError[] = [];
  for (const flight of flights) {
    const span = flightSpan(flight);
    if (span && spansConflict(candidateSpan, span)) {
      errors.push({ code: 'TIME_OVERLAP', field: 'time', conflictingId: flight.id, conflictingKind: 'flight' });
    }
  }
  for (const stay of stays) {
    for (const point of stayPoints(stay)) {
      if (spansConflict(candidateSpan, point)) {
        errors.push({ code: 'TIME_OVERLAP', field: 'time', conflictingId: stay.id, conflictingKind: 'stay' });
        break;
      }
    }
  }
  return errors;
}
