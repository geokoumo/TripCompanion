import type { DomainError } from './errors';
import type { Flight } from './schemas';
import { validateRequiredData } from './validateRequiredData';

/**
 * A minimal, pre-computed timezone-aware chronology result. The real
 * computation (resolving each airport's IANA timezone and comparing real
 * UTC instants) lives in src/features/flights/lib/flightTime.ts, since it
 * depends on airport-specific lookup tables that are feature, not domain,
 * concerns — nothing under src/domain may import from src/features (see
 * index.ts). Callers pass the result of that feature-layer check in here.
 */
export interface FlightChronology {
  isValid: boolean;
  unresolvedTimezone: boolean;
}

/**
 * Canonical domain-level flight validation: required fields, plus — when a
 * chronology result is supplied — arrival strictly after departure.
 *
 * An unresolved timezone (an airport TripCompanion doesn't recognize) never
 * blocks saving: `chronology.isValid` is only checked once the timezone was
 * actually resolved, matching the existing lenient FlightForm behavior of
 * "can't verify it, so don't block it".
 */
export function validateFlight(flight: Flight, chronology?: FlightChronology): DomainError[] {
  const errors = validateRequiredData('flight', flight);
  if (chronology && !chronology.unresolvedTimezone && !chronology.isValid) {
    errors.push({ code: 'FLIGHT_TIME_ORDER', field: 'arrTime' });
  }
  return errors;
}
