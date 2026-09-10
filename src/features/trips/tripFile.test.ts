import { describe, expect, it } from 'vitest';
import { parseImportedTrip } from './lib/tripFile';
import type { Trip } from './types';

function trip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'original-id',
    title: 'Test Trip',
    homeCurrency: 'EUR',
    archived: false,
    description: null,
    travelers: [],
    legs: [],
    flights: [],
    stays: [],
    bookingItems: [],
    documents: [],
    itineraryStops: [],
    ideas: [],
    budgetCategories: [],
    budget: null,
    rememberedLocations: [],
    expenses: [],
    checklistItems: [],
    shareSettings: { enabled: false, includedTabs: [] },
    schemaVersion: 2,
    createdAt: '2026-09-01',
    ...overrides,
  };
}

describe('parseImportedTrip', () => {
  it('parses a valid exported trip JSON', () => {
    const imported = parseImportedTrip(JSON.stringify(trip({ title: 'Imported Trip' })));
    expect(imported.title).toBe('Imported Trip');
  });

  it('always assigns a fresh id, never reusing the id from the file', () => {
    const imported = parseImportedTrip(JSON.stringify(trip({ id: 'original-id' })));
    expect(imported.id).not.toBe('original-id');
  });

  it('produces independent ids when the same file is imported twice', () => {
    const raw = JSON.stringify(trip());
    const first = parseImportedTrip(raw);
    const second = parseImportedTrip(raw);
    expect(first.id).not.toBe(second.id);
  });

  it('throws on malformed JSON', () => {
    expect(() => parseImportedTrip('not json')).toThrow();
  });

  it('throws when the JSON does not match the trip schema', () => {
    expect(() => parseImportedTrip(JSON.stringify({ foo: 'bar' }))).toThrow();
  });
});
