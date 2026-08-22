import type { Trip } from '../../features/trips/types';

export interface TripRepository {
  getTrips(): Promise<Trip[]>;
  getTrip(id: string): Promise<Trip | null>;
  saveTrip(trip: Trip): Promise<void>;
  deleteTrip(id: string): Promise<void>;
}
