import { TripSchema, type Trip, type TripListItem } from '../../features/trips/types';
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

function readRawList(): RawTripRecord[] {
  const raw = storageAdapter.get(TRIPS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RawTripRecord[]) : [];
  } catch {
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

export class LocalStorageTripRepository implements TripRepository {
  /** Wired up by the app shell so a record that fails to load surfaces a toast instead of silently vanishing. */
  onRecordError: (message: string) => void = () => {};

  async getTrips(): Promise<TripListItem[]> {
    migrateLegacyStorage();
    const list = readRawList();
    const items: TripListItem[] = [];
    for (const record of list) {
      try {
        const migrated = migrateTrip(record);
        items.push(tripToListItem(TripSchema.parse(migrated)));
      } catch {
        this.onRecordError('Αποτυχία φόρτωσης ενός ταξιδιού.');
      }
    }
    return items;
  }

  async getTrip(id: string): Promise<Trip | null> {
    migrateLegacyStorage();
    const record = readRawList().find((r) => r.id === id);
    if (!record) return null;
    try {
      const migrated = migrateTrip(record);
      return TripSchema.parse(migrated);
    } catch {
      this.onRecordError('Αποτυχία φόρτωσης ενός ταξιδιού.');
      return null;
    }
  }

  async saveTrip(trip: Trip): Promise<void> {
    const validated = TripSchema.parse(trip);
    const list = readRawList();
    const index = list.findIndex((r) => r.id === validated.id);
    if (index >= 0) {
      list[index] = validated;
    } else {
      list.push(validated);
    }
    writeRawList(list);
  }

  async deleteTrip(id: string): Promise<void> {
    writeRawList(readRawList().filter((r) => r.id !== id));
  }
}
