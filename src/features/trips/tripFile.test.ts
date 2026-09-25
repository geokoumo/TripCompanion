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

  // F-08: an imported file bypasses LegFormSchema/StayForm's own UI-level
  // date-order checks entirely, so this must be re-checked at the import
  // boundary rather than relying on those forms having been used to produce it.
  it('rejects an imported trip containing a leg whose end date precedes its start date', () => {
    const bad = trip({ legs: [{ id: 'l1', city: 'Rome', country: 'Italy', startDate: '2026-09-08', endDate: '2026-09-05', currency: 'EUR' }] });
    expect(() => parseImportedTrip(JSON.stringify(bad))).toThrow();
  });

  it('rejects an imported trip containing a stay whose checkout precedes its checkin', () => {
    const bad = trip({
      stays: [
        {
          id: 's1',
          name: 'Hotel',
          address: 'Somewhere',
          checkinDate: '2026-09-08',
          checkinTime: '14:00',
          checkoutDate: '2026-09-05',
          checkoutTime: '11:00',
        },
      ],
    });
    expect(() => parseImportedTrip(JSON.stringify(bad))).toThrow();
  });
});
