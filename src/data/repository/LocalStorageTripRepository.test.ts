import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageTripRepository } from './LocalStorageTripRepository';
import type { Trip } from '../../features/trips/types';

const TRIPS_KEY = 'tripcompanion:trips';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Trip',
    homeCurrency: 'EUR',
    archived: false,
    travelers: [],
    legs: [],
    flights: [],
    stays: [],
    bookingItems: [],
    documents: [],
    itineraryStops: [],
    ideas: [],
    budgetCategories: [],
    rememberedLocations: [],
    expenses: [],
    checklistItems: [],
    shareSettings: { enabled: false, includedTabs: [] },
    schemaVersion: 2,
    createdAt: new Date().toISOString(),
    ...overrides,
  } as Trip;
}

beforeEach(() => {
  localStorage.clear();
});

describe('LocalStorageTripRepository — corrupted top-level storage', () => {
  it('getTrips reports corruption and returns an empty list instead of throwing, when the stored value is not valid JSON', async () => {
    localStorage.setItem(TRIPS_KEY, '{not valid json');
    const repo = new LocalStorageTripRepository();
    const errors: string[] = [];
    repo.onRecordError = (message) => errors.push(message);

    const trips = await repo.getTrips();

    expect(trips).toEqual([]);
    expect(errors).toContain('Your saved trips could not be read. Local data may be corrupted.');
  });

  it('getTrips reports corruption when the stored value parses but is not an array', async () => {
    localStorage.setItem(TRIPS_KEY, JSON.stringify({ unexpected: 'shape' }));
    const repo = new LocalStorageTripRepository();
    const errors: string[] = [];
    repo.onRecordError = (message) => errors.push(message);

    const trips = await repo.getTrips();

    expect(trips).toEqual([]);
    expect(errors).toContain('Your saved trips could not be read. Local data may be corrupted.');
  });

  it('saveTrip refuses to write on top of corrupted storage rather than silently discarding whatever is there', async () => {
    localStorage.setItem(TRIPS_KEY, '{not valid json');
    const repo = new LocalStorageTripRepository();

    await expect(repo.saveTrip(makeTrip())).rejects.toThrow();

    // The corrupted key must be untouched — a failed save must never
    // overwrite unreadable data with a truncated "just this one trip" list.
    expect(localStorage.getItem(TRIPS_KEY)).toBe('{not valid json');
  });

  it('deleteTrip refuses to write on top of corrupted storage rather than silently discarding whatever is there', async () => {
    localStorage.setItem(TRIPS_KEY, '{not valid json');
    const repo = new LocalStorageTripRepository();

    await expect(repo.deleteTrip('t1')).rejects.toThrow();
    expect(localStorage.getItem(TRIPS_KEY)).toBe('{not valid json');
  });

  it('one malformed trip record does not prevent the rest of the list from loading', async () => {
    localStorage.setItem(TRIPS_KEY, JSON.stringify([{ id: 'broken', not: 'a trip' }, makeTrip({ id: 't2', title: 'Good Trip' })]));
    const repo = new LocalStorageTripRepository();
    const errors: string[] = [];
    repo.onRecordError = (message) => errors.push(message);

    const trips = await repo.getTrips();

    expect(trips).toHaveLength(1);
    expect(trips[0].id).toBe('t2');
    expect(errors).toContain('Failed to load a trip.');
  });
});
