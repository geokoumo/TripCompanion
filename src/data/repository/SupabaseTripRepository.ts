import { supabase } from '../supabase/client';
import { SearchResultGroupSchema, type SearchResultGroup } from '../../features/search/types';
import { TripListItemSchema, TripSchema, type Trip, type TripListItem } from '../../features/trips/types';
import { hasInvalidDateOrder } from '../../features/trips/validation';
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
        this.onRecordError('Failed to load a trip.');
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
    // F-08: same guard as LocalStorageTripRepository — reject client-side
    // rather than relying solely on the DB's CHECK constraints, so both
    // backends fail the same way (and an import bypassing UI-level checks
    // is still rejected before spending a round trip on it).
    if (hasInvalidDateOrder(validated)) {
      throw new Error('invalid-date-order');
    }
    const { error } = await this.client().rpc('upsert_full_trip', { _trip: validated });
    if (error) throw error;
  }

  async deleteTrip(id: string): Promise<void> {
    // RLS + the cascade chain in schema.sql handles removing every child
    // row, including the `documents` table — but that's only the metadata.
    // The uploaded files themselves live in the trip-files Storage bucket
    // under {user_id}/{trip_id}/, which cascade never touches, so a deleted
    // trip's boarding passes/confirmations/tickets would otherwise sit in
    // Storage forever with nothing in the app able to reference or remove
    // them again. Clean the whole folder up before the DB row goes.
    const client = this.client();
    const { data: userData } = await client.auth.getUser();
    const userId = userData.user?.id;
    if (userId) {
      const folder = `${userId}/${id}`;
      const { data: files } = await client.storage.from('trip-files').list(folder, { limit: 1000 });
      if (files && files.length > 0) {
        await client.storage.from('trip-files').remove(files.map((f) => `${folder}/${f.name}`));
      }
    }

    const { error } = await client.from('trips').delete().eq('id', id);
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
        this.onRecordError('Search failed.');
      }
    }
    return groups;
  }
}
