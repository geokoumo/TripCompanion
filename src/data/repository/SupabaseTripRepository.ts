import { supabase } from '../supabase/client';
import { SearchResultGroupSchema, type SearchResultGroup } from '../../features/search/types';
import { TripListItemSchema, TripSchema, type Trip, type TripListItem } from '../../features/trips/types';
import type { TripRepository } from './TripRepository';

/**
 * Backs the account-signed-in data path. Nested-object assembly always goes
 * through a Postgres function (list_trips/get_full_trip/upsert_full_trip —
 * see supabase/migrations/) rather than hand-rolled table-by-table queries,
 * because that mapping and the ownership checks already live there, tested.
 * Every RPC response is parsed through a Zod schema before it reaches the
 * app, so a schema/mapping mismatch surfaces immediately as a thrown error
 * instead of a malformed object silently propagating into the UI.
 */
export class SupabaseTripRepository implements TripRepository {
  onRecordError: (message: string) => void = () => {};

  private client() {
    if (!supabase) throw new Error('Supabase client is not configured.');
    return supabase;
  }

  async getTrips(): Promise<TripListItem[]> {
    // One round trip, not one get_full_trip call per trip — list_trips()
    // returns exactly the summary the Home screen needs (schema.sql /
    // list_trips.sql, now committed under supabase/migrations/).
    const { data, error } = await this.client().rpc('list_trips');
    if (error) throw error;

    const rows: unknown[] = Array.isArray(data) ? data : [];
    const items: TripListItem[] = [];
    for (const row of rows) {
      try {
        items.push(TripListItemSchema.parse(row));
      } catch {
        this.onRecordError('Αποτυχία φόρτωσης ενός ταξιδιού.');
      }
    }
    return items;
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

  async searchTrips(query: string): Promise<SearchResultGroup[]> {
    if (!query.trim()) return [];
    const { data, error } = await this.client().rpc('search_trips', { _query: query.trim() });
    if (error) throw error;

    const rows: unknown[] = Array.isArray(data) ? data : [];
    const groups: SearchResultGroup[] = [];
    for (const row of rows) {
      try {
        groups.push(SearchResultGroupSchema.parse(row));
      } catch {
        this.onRecordError('Αποτυχία αναζήτησης.');
      }
    }
    return groups;
  }
}
