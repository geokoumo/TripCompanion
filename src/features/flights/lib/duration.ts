import { checkFlightTimeOrder, type FlightTimeInput } from './flightTime';

export interface FlightDuration {
  totalMinutes: number;
  label: string; // e.g. "4ω 45λ"
}

/**
 * Derives the displayed flight duration from the two timezone-resolved
 * datetimes. Returns null when either timezone is unresolved or the
 * order is invalid (arrival not after departure).
 */
export function computeFlightDuration(input: FlightTimeInput): FlightDuration | null {
  const result = checkFlightTimeOrder(input);
  if (!result.isValid || result.depUtcMs === null || result.arrUtcMs === null) {
    return null;
  }
  const totalMinutes = Math.round((result.arrUtcMs - result.depUtcMs) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const label = hours > 0 ? `${hours}ω ${minutes}λ` : `${minutes}λ`;
  return { totalMinutes, label };
}

/** True when the arrival calendar date (in the arrival's local timezone) is after the departure calendar date. */
export function arrivesNextDay(depDate: string, arrDate: string): boolean {
  return arrDate > depDate;
}
