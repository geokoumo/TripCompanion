import type { Flight } from '../../flights/types';
import type { Stay } from '../../stays/types';
import type { Leg } from '../types';

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * The trip's overall date span is never stored directly — it's derived from
 * the min/max of its legs' dates, folding in flight departure/arrival dates
 * and stay check-in/check-out dates too (each can extend the range on
 * either edge — together they make up the complete travel window).
 */
export function getTripDateRange(legs: Leg[], flights: Flight[] = [], stays: Stay[] = []): DateRange | null {
  const dates: string[] = [];
  for (const leg of legs) {
    if (leg.startDate) dates.push(leg.startDate);
    if (leg.endDate) dates.push(leg.endDate);
  }
  for (const flight of flights) {
    if (flight.depDate) dates.push(flight.depDate);
    if (flight.arrDate) dates.push(flight.arrDate);
  }
  for (const stay of stays) {
    if (stay.checkinDate) dates.push(stay.checkinDate);
    if (stay.checkoutDate) dates.push(stay.checkoutDate);
  }
  if (dates.length === 0) return null;
  return { startDate: dates.reduce((a, b) => (b < a ? b : a)), endDate: dates.reduce((a, b) => (b > a ? b : a)) };
}
