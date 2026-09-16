import { todayStr } from '../../../shared/lib/dateFormat';
import type { TripListItem } from '../types';

/**
 * Resolves which trip the global "Itinerary"/"Organizer" nav destinations
 * should jump into when there's no trip already open: whichever trip's
 * dated range contains today, else the soonest upcoming one, else null (no
 * eligible trip — callers fall back to the Trips list instead of guessing).
 * Archived trips and trips missing dates are never a valid target.
 */
export function getActiveOrNextTrip(trips: TripListItem[]): TripListItem | null {
  const eligible = trips.filter((t): t is TripListItem & { startDate: string; endDate: string } => !t.archived && !!t.startDate && !!t.endDate);
  const today = todayStr();

  const ongoing = eligible.find((t) => t.startDate <= today && today <= t.endDate);
  if (ongoing) return ongoing;

  const upcoming = eligible.filter((t) => t.startDate > today).sort((a, b) => a.startDate.localeCompare(b.startDate));
  return upcoming[0] ?? null;
}
