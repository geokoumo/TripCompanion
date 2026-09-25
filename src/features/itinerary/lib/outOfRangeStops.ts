import { validateActivityDate } from '../../../domain';
import { tripActivityRange } from './activityValidation';
import type { Trip } from '../../trips/types';
import type { ItineraryStop } from '../types';

/**
 * Itinerary stops that fall outside the trip's current derived date range
 * (F-05). Editing a stay or flight's dates can shrink the trip's overall
 * range (getTripDateRange), silently making an already-scheduled stop
 * invalid per the same rule validateStopForSave enforces at save time —
 * previously discoverable only by opening Trip Health. Callers use this
 * right after such an edit to surface it immediately instead.
 */
export function findStopsOutOfRange(trip: Pick<Trip, 'legs' | 'flights' | 'stays' | 'itineraryStops'>): ItineraryStop[] {
  const range = tripActivityRange(trip);
  return trip.itineraryStops.filter((stop) => validateActivityDate(stop.date, range).some((e) => e.code === 'DATE_OUT_OF_RANGE'));
}

/** A plain-language toast message naming how many stops are affected, or null when none are. Never invented UI beyond a single functional message (F-05's stated scope). */
export function outOfRangeStopsMessage(stops: ItineraryStop[]): string | null {
  if (stops.length === 0) return null;
  const isSingle = stops.length === 1;
  const noun = isSingle ? 'itinerary stop' : 'itinerary stops';
  const verb = isSingle ? 'falls' : 'fall';
  return `${stops.length} ${noun} now ${verb} outside the trip dates. Check Trip Health.`;
}
