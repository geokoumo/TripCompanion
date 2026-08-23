import type { Flight } from '../../flights/types';
import type { Leg } from '../types';

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * The trip's overall date span is never stored directly — it's derived from
 * the min/max of its legs' dates, folding in flight departure/arrival dates
 * too (a flight can extend the range on either edge).
 */
export function getTripDateRange(legs: Leg[], flights: Flight[] = []): DateRange | null {
  const dates: string[] = [];
  for (const leg of legs) {
    if (leg.startDate) dates.push(leg.startDate);
    if (leg.endDate) dates.push(leg.endDate);
  }
  for (const flight of flights) {
    if (flight.depDate) dates.push(flight.depDate);
    if (flight.arrDate) dates.push(flight.arrDate);
  }
  if (dates.length === 0) return null;
  return { startDate: dates.reduce((a, b) => (b < a ? b : a)), endDate: dates.reduce((a, b) => (b > a ? b : a)) };
}
