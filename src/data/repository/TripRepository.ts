import type { SearchResultGroup } from '../../features/search/types';
import type { Trip, TripListItem } from '../../features/trips/types';

export interface TripRepository {
  /** Lightweight summaries for the Home/trip-list screen — never a per-trip full fetch. */
  getTrips(): Promise<TripListItem[]>;
  /** The full nested trip, for opening a specific trip (or any write). */
  getTrip(id: string): Promise<Trip | null>;
  saveTrip(trip: Trip): Promise<void>;
  deleteTrip(id: string): Promise<void>;
  /** Across the signed-in user's own trips only — never destination discovery. Empty query -> empty result, no listing-everything fallback. */
  searchTrips(query: string): Promise<SearchResultGroup[]>;
  /** Optional hook a repository can call when one record fails to load, so the UI can surface it instead of silently dropping it. */
  onRecordError?: (message: string) => void;
}
