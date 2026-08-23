import { daysBetween, todayStr } from '../../../shared/lib/dateFormat';
import { getTripStatus, type Leg, type Trip } from '../types';
import { getTripDateRange } from './dateRange';

export function destinationLabel(legs: Leg[]): string {
  const named = legs.filter((l) => l.city.trim());
  if (named.length === 0) return 'Χωρίς πόλεις';
  if (named.length === 1) return named[0]!.city;
  return named.map((l) => l.city).join(' → ');
}

/** Home-card / trip-menu status stamp copy — five states per spec. */
export function statusStampLabel(trip: Trip): string {
  if (trip.archived) return 'αρχείο';
  const range = getTripDateRange(trip.legs, trip.flights);
  const status = getTripStatus(range);
  if (status === 'upcoming' && range) {
    const days = daysBetween(todayStr(), range.startDate);
    return days === 1 ? 'σε 1 μέρα' : `σε ${days} μέρες`;
  }
  if (status === 'today') return 'σήμερα';
  if (status === 'ongoing') return 'σε εξέλιξη';
  return 'ολοκληρώθηκε';
}
