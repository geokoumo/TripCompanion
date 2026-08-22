import { localDateTimeToUtc, resolveTimezone } from './timezones';

export interface FlightTimeInput {
  depDate: string;
  depTime: string;
  depAirport: string;
  arrDate: string;
  arrTime: string;
  arrAirport: string;
  depTimezoneOverride?: string;
  arrTimezoneOverride?: string;
}

export interface FlightTimeResult {
  /** True when both timezones could be resolved and arrival really is after departure. */
  isValid: boolean;
  /** True only when a timezone could not be resolved for one of the airports. */
  unresolvedTimezone: boolean;
  depUtcMs: number | null;
  arrUtcMs: number | null;
}

/**
 * Computes whether a flight's arrival instant is genuinely after its departure
 * instant, resolving each leg's local time via its airport's IANA timezone so
 * midnight crossings and DST transitions are handled correctly.
 */
export function checkFlightTimeOrder(input: FlightTimeInput): FlightTimeResult {
  const depTz = resolveTimezone(input.depAirport, input.depTimezoneOverride);
  const arrTz = resolveTimezone(input.arrAirport, input.arrTimezoneOverride);

  if (!depTz || !arrTz) {
    return { isValid: false, unresolvedTimezone: true, depUtcMs: null, arrUtcMs: null };
  }

  const depUtcMs = localDateTimeToUtc(input.depDate, input.depTime, depTz);
  const arrUtcMs = localDateTimeToUtc(input.arrDate, input.arrTime, arrTz);

  if (Number.isNaN(depUtcMs) || Number.isNaN(arrUtcMs)) {
    return { isValid: false, unresolvedTimezone: false, depUtcMs: null, arrUtcMs: null };
  }

  return {
    isValid: arrUtcMs > depUtcMs,
    unresolvedTimezone: false,
    depUtcMs,
    arrUtcMs,
  };
}
