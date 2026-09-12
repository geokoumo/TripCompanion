import type { Trip } from '../../features/trips/types';
import type { ItineraryStop } from '../../features/itinerary/types';

/** Pure entity-level operations on a trip's itinerary stops — see expenseRepository.ts for why these are Trip -> Trip functions rather than direct Supabase calls. */

/** Inserts a new stop, or replaces the one with a matching id. */
export function upsertItineraryStop(trip: Trip, stop: ItineraryStop): Trip {
  const exists = trip.itineraryStops.some((s) => s.id === stop.id);
  return {
    ...trip,
    itineraryStops: exists ? trip.itineraryStops.map((s) => (s.id === stop.id ? stop : s)) : [...trip.itineraryStops, stop],
  };
}
