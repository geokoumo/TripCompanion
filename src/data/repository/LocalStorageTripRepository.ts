import { TripSchema, type Trip } from '../../features/trips/types';
import { migrateTrip } from '../migrations';
import { storageAdapter } from '../storage/storageAdapter';
import type { TripRepository } from './TripRepository';

const INDEX_KEY = 'tripcompanion:tripIds';
const tripKey = (id: string) => `tripcompanion:trip:${id}`;

function readIndex(): string[] {
  const raw = storageAdapter.get(INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(ids: string[]): void {
  storageAdapter.set(INDEX_KEY, JSON.stringify(ids));
}

export class LocalStorageTripRepository implements TripRepository {
  async getTrips(): Promise<Trip[]> {
    const ids = readIndex();
    const trips: Trip[] = [];
    for (const id of ids) {
      const trip = await this.getTrip(id);
      if (trip) trips.push(trip);
    }
    return trips;
  }

  async getTrip(id: string): Promise<Trip | null> {
    const raw = storageAdapter.get(tripKey(id));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const migrated = migrateTrip(parsed);
      return TripSchema.parse(migrated);
    } catch {
      return null;
    }
  }

  async saveTrip(trip: Trip): Promise<void> {
    const validated = TripSchema.parse(trip);
    storageAdapter.set(tripKey(validated.id), JSON.stringify(validated));
    const ids = readIndex();
    if (!ids.includes(validated.id)) {
      writeIndex([...ids, validated.id]);
    }
  }

  async deleteTrip(id: string): Promise<void> {
    storageAdapter.remove(tripKey(id));
    writeIndex(readIndex().filter((existingId) => existingId !== id));
  }
}
