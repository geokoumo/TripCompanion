import type { Leg } from '../../trips/types';

export interface DayProgress {
  /** 1-based position of the date within the trip's full day range. */
  dayNumber: number;
  totalDays: number;
}

/** Where `date` falls within `days` (the trip's full day range), or null if it isn't in range. Never hardcoded — derived from the trip's own leg/flight dates via getTripDateRange. */
export function computeDayProgress(days: string[], date: string): DayProgress | null {
  const index = days.indexOf(date);
  if (index === -1) return null;
  return { dayNumber: index + 1, totalDays: days.length };
}

export type LegContext = 'arrival' | 'departure' | null;

/** Whether `date` is the first day of `leg` (arrival) or the last (departure). A single-day leg reports as arrival, the more informative of the two labels for a same-day stop. */
export function legContextForDate(leg: Pick<Leg, 'startDate' | 'endDate'>, date: string): LegContext {
  if (date === leg.startDate) return 'arrival';
  if (date === leg.endDate) return 'departure';
  return null;
}
