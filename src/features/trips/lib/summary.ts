import { daysBetween, todayStr } from '../../../shared/lib/dateFormat';
import { getTripStatus, type Leg, type Trip } from '../types';

export function destinationLabel(legs: Leg[]): string {
  if (legs.length === 0) return 'Χωρίς προορισμό';
  if (legs.length === 1) return legs[0]!.city;
  return legs.map((l) => l.city).join(' → ');
}

export function countdownLabel(trip: Trip): string | null {
  const status = getTripStatus(trip);
  if (status === 'upcoming') {
    const days = daysBetween(todayStr(), trip.startDate);
    return days === 0 ? 'ΣΗΜΕΡΑ' : days === 1 ? 'ΣΕ 1 ΜΕΡΑ' : `ΣΕ ${days} ΜΕΡΕΣ`;
  }
  if (status === 'ongoing') return 'ΣΕ ΕΞΕΛΙΞΗ';
  return 'ΟΛΟΚΛΗΡΩΜΕΝΟ';
}
