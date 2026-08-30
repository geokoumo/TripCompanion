import { supabase } from '../supabase/client';
import { TripSchema, type Trip } from '../../features/trips/types';
import type { TripRepository } from './TripRepository';

/**
 * Backs the account-signed-in data path. Every read/write goes through the
 * get_full_trip/upsert_full_trip RPCs (schema.sql / full_trip_rpcs.sql) —
 * never hand-rolled table queries — because the nested-object mapping
 * (legs, travelers, flights, stays, itinerary, budget, checklist) and the
 * ownership checks already live there, tested. Every RPC response is parsed
 * through TripSchema before it reaches the app, so a schema/mapping mismatch
 * surfaces immediately as a thrown error instead of a malformed trip
 * silently propagating into the UI.
 */
export class SupabaseTripRepository implements TripRepository {
  onRecordError: (message: string) => void = () => {};

  private client() {
    if (!supabase) throw new Error('Supabase client is not configured.');
    return supabase;
  }

  async getTrips(): Promise<Trip[]> {
    // Only `id` is fetched directly from the trips table — the exact shape of
    // that table beyond id/ownership isn't something this codebase has
    // visibility into (schema.sql lives outside the app repo), so listing
    // fields like title/dates can't safely be selected by name here without
    // risking a guess at a column that doesn't exist. Once those column
    // names are confirmed, swap this for a lighter list query/RPC instead of
    // a get_full_trip call per trip.
    const { data, error } = await this.client().from('trips').select('id');
    if (error) throw error;

    const ids = (data ?? []).map((row) => row.id as string);
    const trips: Trip[] = [];
    for (const id of ids) {
      try {
        const trip = await this.getTrip(id);
        if (trip) trips.push(trip);
      } catch {
        this.onRecordError('Αποτυχία φόρτωσης ενός ταξιδιού.');
      }
    }
    return trips;
  }

  async getTrip(id: string): Promise<Trip | null> {
    const { data, error } = await this.client().rpc('get_full_trip', { _trip_id: id });
    if (error) throw error;
    if (!data) return null;
    return TripSchema.parse(data);
  }

  async saveTrip(trip: Trip): Promise<void> {
    const validated = TripSchema.parse(trip);
    const { error } = await this.client().rpc('upsert_full_trip', { _trip: validated });
    if (error) throw error;
  }

  async deleteTrip(id: string): Promise<void> {
    // RLS + the cascade chain in schema.sql handles removing every child row.
    const { error } = await this.client().from('trips').delete().eq('id', id);
    if (error) throw error;
  }
}
