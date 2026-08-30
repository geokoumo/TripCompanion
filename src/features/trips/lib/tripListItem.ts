import type { Trip, TripListItem } from '../types';
import { getTripDateRange } from './dateRange';

/**
 * Derives the Home-screen list summary from a full Trip. Used by
 * LocalStorageTripRepository (which only ever has full trips on hand) and by
 * TripsProvider.saveTrip (to keep the in-memory list in sync after a write
 * without a round trip back through list_trips()).
 */
export function tripToListItem(trip: Trip): TripListItem {
  // Flight-inclusive range, unlike list_trips()'s legs-only min/max — this
  // preserves local-only mode's existing "flights can extend the range"
  // behavior rather than narrowing it to match the SQL function.
  const range = getTripDateRange(trip.legs, trip.flights);
  const cities = [...trip.legs]
    .filter((leg) => leg.city.trim())
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((leg) => leg.city);

  return {
    id: trip.id,
    title: trip.title,
    archived: trip.archived,
    startDate: range?.startDate ?? null,
    endDate: range?.endDate ?? null,
    cities,
    travelers: trip.travelers.map((t) => ({ name: t.name, avatarColor: t.avatarColor })),
  };
}
