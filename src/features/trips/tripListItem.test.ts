import { describe, expect, it } from 'vitest';
import { tripToListItem } from './lib/tripListItem';
import type { Trip } from './types';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Ιαπωνία 2026',
    homeCurrency: 'EUR',
    archived: false,
    travelers: [],
    legs: [],
    flights: [],
    stays: [],
    itineraryStops: [],
    ideas: [],
    budgetCategories: [],
    rememberedLocations: [],
    expenses: [],
    checklistItems: [],
    shareSettings: { enabled: false, includedTabs: [] },
    schemaVersion: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('tripToListItem', () => {
  it('derives cities ordered by leg start date, not array order', () => {
    const trip = makeTrip({
      legs: [
        { id: 'l2', city: 'Παρίσι', country: 'Γαλλία', startDate: '2026-09-10', endDate: '2026-09-14', currency: 'EUR' },
        { id: 'l1', city: 'Τόκιο', country: 'Ιαπωνία', startDate: '2026-09-05', endDate: '2026-09-09', currency: 'JPY' },
      ],
    });
    const item = tripToListItem(trip);
    expect(item.cities).toEqual(['Τόκιο', 'Παρίσι']);
    expect(item.startDate).toBe('2026-09-05');
    expect(item.endDate).toBe('2026-09-14');
  });

  it('produces a null date range when there are no legs or flights', () => {
    const item = tripToListItem(makeTrip());
    expect(item.startDate).toBeNull();
    expect(item.endDate).toBeNull();
    expect(item.cities).toEqual([]);
  });

  it('keeps only name/avatarColor for travelers, dropping id', () => {
    const trip = makeTrip({ travelers: [{ id: 'tr1', name: 'Άννα', avatarColor: 'avatar-2' }] });
    const item = tripToListItem(trip);
    expect(item.travelers).toEqual([{ name: 'Άννα', avatarColor: 'avatar-2' }]);
  });

  it('carries id, title and archived through unchanged', () => {
    const trip = makeTrip({ id: 't9', title: 'Ρώμη', archived: true });
    const item = tripToListItem(trip);
    expect(item).toMatchObject({ id: 't9', title: 'Ρώμη', archived: true });
  });
});
