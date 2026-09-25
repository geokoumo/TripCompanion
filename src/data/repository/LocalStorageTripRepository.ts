import { searchWithinTrip } from '../../features/search/lib/searchLocalTrip';
import type { SearchResultGroup } from '../../features/search/types';
import { TripSchema, type Trip, type TripListItem } from '../../features/trips/types';
import { hasInvalidDateOrder } from '../../features/trips/validation';
import { tripToListItem } from '../../features/trips/lib/tripListItem';
import { migrateTrip } from '../migrations';
import { storageAdapter } from '../storage/storageAdapter';
import type { TripRepository } from './TripRepository';

const TRIPS_KEY = 'tripcompanion:trips';

// Superseded single-key-per-trip format. Only read once, to migrate existing
// data into TRIPS_KEY, then removed — see migrateLegacyStorage().
const LEGACY_INDEX_KEY = 'tripcompanion:tripIds';
const legacyTripKey = (id: string) => `tripcompanion:trip:${id}`;

type RawTripRecord = Record<string, unknown>;

// `raw` corrupted here means something outside this app's own writes
// clobbered the key (setItem is atomic, so the app itself never leaves it
// half-written) — surface that distinctly from "no trips yet" rather than
// silently presenting an empty list, which would look like the user's trips
// just vanished. Never write anything back in this branch: the corrupted
// key is left alone in storage in case some other repair is possible.
function readRawList(onCorrupted?: () => void): RawTripRecord[] {
  const raw = storageAdapter.get(TRIPS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      onCorrupted?.();
      return [];
    }
    return parsed as RawTripRecord[];
  } catch {
    onCorrupted?.();
    return [];
  }
}

function writeRawList(list: RawTripRecord[]): void {
  storageAdapter.set(TRIPS_KEY, JSON.stringify(list));
}

/**
 * One-time migration from the old index-key-plus-per-trip-key storage format
 * to the single consolidated key. Runs at most once per browser: after it
 * completes, TRIPS_KEY exists (even if empty) so this is a no-op thereafter.
 */
function migrateLegacyStorage(): void {
  if (storageAdapter.get(TRIPS_KEY) !== null) return;

  const legacyIndexRaw = storageAdapter.get(LEGACY_INDEX_KEY);
  if (!legacyIndexRaw) {
    writeRawList([]);
    return;
  }

  let ids: string[] = [];
  try {
    const parsed = JSON.parse(legacyIndexRaw);
    ids = Array.isArray(parsed) ? parsed : [];
  } catch {
    ids = [];
  }

  const migrated: RawTripRecord[] = [];
  for (const id of ids) {
    const raw = storageAdapter.get(legacyTripKey(id));
    if (!raw) continue;
    try {
      migrated.push(JSON.parse(raw) as RawTripRecord);
    } catch {
      // Unreadable legacy record — nothing to carry forward for this one.
      // getTrips() reports load failures for records it can't parse/validate,
      // but a record that never made it into the migrated list can't be
      // reported by id here, so this is the one silent-drop case: the record
      // was already unreadable before this migration ever ran.
    }
  }

  writeRawList(migrated);

  for (const id of ids) {
    storageAdapter.remove(legacyTripKey(id));
  }
  storageAdapter.remove(LEGACY_INDEX_KEY);
}

const CORRUPTED_MESSAGE = 'Your saved trips could not be read. Local data may be corrupted.';

export class LocalStorageTripRepository implements TripRepository {
  /** Wired up by the app shell so a record that fails to load surfaces a toast instead of silently vanishing. */
  onRecordError: (message: string) => void = () => {};

  async getTrips(): Promise<TripListItem[]> {
    migrateLegacyStorage();
    const list = readRawList(() => this.onRecordError(CORRUPTED_MESSAGE));
    const items: TripListItem[] = [];
    for (const record of list) {
      try {
        const migrated = migrateTrip(record);
        items.push(tripToListItem(TripSchema.parse(migrated)));
      } catch {
        this.onRecordError('Failed to load a trip.');
      }
    }
    return items;
  }

  async getTrip(id: string): Promise<Trip | null> {
    migrateLegacyStorage();
    const record = readRawList(() => this.onRecordError(CORRUPTED_MESSAGE)).find((r) => r.id === id);
    if (!record) return null;
    try {
      const migrated = migrateTrip(record);
      return TripSchema.parse(migrated);
    } catch {
      this.onRecordError('Failed to load a trip.');
      return null;
    }
  }

  async saveTrip(trip: Trip): Promise<void> {
    const validated = TripSchema.parse(trip);
    // F-08: mirrors the DB CHECK constraints Supabase already enforces
    // (legs.end_date >= start_date; stays' checkout >= checkin) — a backward
    // leg/stay must be rejected here too, not just on the Supabase backend,
    // so the two persistence modes reject the same data. Never applied to
    // reads: an already-persisted trip that predates this check still loads.
    if (hasInvalidDateOrder(validated)) {
      throw new Error('invalid-date-order');
    }
    // If the existing key is unreadable, writing on top of it would persist
    // an empty-list interpretation over storage.getItem()'s true (corrupted)
    // contents — turning a possibly-recoverable corruption into a permanent
    // loss of every other trip. Refuse the write instead; the caller's
    // existing save-failed handling (rollback + toast) takes it from there.
    let corrupted = false;
    const list = readRawList(() => {
      corrupted = true;
    });
    if (corrupted) throw new Error('local-storage-corrupted');
    const index = list.findIndex((r) => r.id === validated.id);
    if (index >= 0) {
      list[index] = validated;
    } else {
      list.push(validated);
    }
    writeRawList(list);
  }

  async deleteTrip(id: string): Promise<void> {
    let corrupted = false;
    const list = readRawList(() => {
      corrupted = true;
    });
    if (corrupted) throw new Error('local-storage-corrupted');
    writeRawList(list.filter((r) => r.id !== id));
  }

  async searchTrips(query: string): Promise<SearchResultGroup[]> {
    if (!query.trim()) return [];
    migrateLegacyStorage();
    const groups: SearchResultGroup[] = [];
    for (const record of readRawList(() => this.onRecordError(CORRUPTED_MESSAGE))) {
      let trip: Trip;
      try {
        trip = TripSchema.parse(migrateTrip(record));
      } catch {
        this.onRecordError('Failed to load a trip.');
        continue;
      }
      const matches = searchWithinTrip(trip, query);
      if (matches.length > 0) groups.push({ tripId: trip.id, tripTitle: trip.title, matches });
    }
    return groups;
  }
}
