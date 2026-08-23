import type { Trip } from '../../features/trips/types';

export interface TripRepository {
  getTrips(): Promise<Trip[]>;
  getTrip(id: string): Promise<Trip | null>;
  saveTrip(trip: Trip): Promise<void>;
  deleteTrip(id: string): Promise<void>;
  /** Optional hook a repository can call when one record fails to load, so the UI can surface it instead of silently dropping it. */
  onRecordError?: (message: string) => void;
}
