import { daysBetween, todayStr } from '../../../shared/lib/dateFormat';
import { getTripStatus } from '../types';
import type { DateRange } from './dateRange';

export function destinationLabel(cities: string[]): string {
  if (cities.length === 0) return 'Χωρίς πόλεις';
  if (cities.length === 1) return cities[0]!;
  return cities.join(' → ');
}

/** Home-card / trip-menu status stamp copy — five states per spec. */
export function statusStampLabel({ archived, range }: { archived: boolean; range: DateRange | null }): string {
  if (archived) return 'αρχείο';
  const status = getTripStatus(range);
  if (status === 'upcoming' && range) {
    const days = daysBetween(todayStr(), range.startDate);
    return days === 1 ? 'σε 1 μέρα' : `σε ${days} μέρες`;
  }
  if (status === 'today') return 'σήμερα';
  if (status === 'ongoing') return 'σε εξέλιξη';
  return 'ολοκληρώθηκε';
}
