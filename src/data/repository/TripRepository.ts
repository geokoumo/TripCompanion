import type { Trip, TripListItem } from '../../features/trips/types';

export interface TripRepository {
  /** Lightweight summaries for the Home/trip-list screen — never a per-trip full fetch. */
  getTrips(): Promise<TripListItem[]>;
  /** The full nested trip, for opening a specific trip (or any write). */
  getTrip(id: string): Promise<Trip | null>;
  saveTrip(trip: Trip): Promise<void>;
  deleteTrip(id: string): Promise<void>;
  /** Optional hook a repository can call when one record fails to load, so the UI can surface it instead of silently dropping it. */
  onRecordError?: (message: string) => void;
}
