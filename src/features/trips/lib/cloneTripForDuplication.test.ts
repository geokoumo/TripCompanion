import { describe, expect, it } from 'vitest';
import { cloneTripForDuplication } from './cloneTripForDuplication';
import type { Trip } from '../types';

function makeFullTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    title: 'Paris Trip',
    homeCurrency: 'EUR',
    archived: false,
    description: 'A week in Paris',
    coverPhotoPath: 'user-1/trip-1/1700000000-cover.jpg',
    travelers: [
      { id: 'trav-1', name: 'Alex', avatarColor: 'avatar-1' },
      { id: 'trav-2', name: 'Sam', avatarColor: 'avatar-2' },
    ],
    legs: [{ id: 'leg-1', city: 'Paris', country: 'France', startDate: '2026-05-01', endDate: '2026-05-08', currency: 'EUR', exchangeRateToHome: null }],
    flights: [
      {
        id: 'flight-1',
        legId: 'leg-1',
        airline: 'Air France',
        flightNumber: 'AF123',
        depAirport: 'JFK',
        depDate: '2026-05-01',
        depTime: '10:00',
        arrAirport: 'CDG',
        arrDate: '2026-05-01',
        arrTime: '22:00',
        status: 'scheduled',
      },
    ],
    stays: [
      {
        id: 'stay-1',
        legId: 'leg-1',
        name: 'Hotel Lutetia',
        address: '45 Boulevard Raspail',
        checkinDate: '2026-05-01',
        checkinTime: '15:00',
        checkoutDate: '2026-05-08',
        checkoutTime: '11:00',
      },
    ],
    bookingItems: [
      {
        id: 'booking-1',
        legId: 'leg-1',
        type: 'restaurant',
        name: 'Le Comptoir',
        details: { cuisineType: 'French', priceRange: '$$$' },
      },
    ],
    documents: [{ id: 'doc-1', category: 'ticket', title: 'Boarding pass', storagePath: 'user-1/trip-1/1700000001-pass.pdf', fileType: 'pdf', uploadedAt: '2026-04-01T00:00:00Z' }],
    itineraryStops: [
      { id: 'stop-1', legId: 'leg-1', date: '2026-05-02', time: '10:00', allDay: false, durationMinutes: 60, title: 'Louvre', type: 'sight', travelerIds: ['trav-1', 'trav-2'], done: false },
    ],
    ideas: [{ id: 'idea-1', title: 'Eiffel Tower at night', type: 'sight', suggestedDate: '2026-05-03' }],
    budgetCategories: [{ id: 'cat-1', name: 'Food', color: 'rust' }],
    budget: 2000,
    rememberedLocations: ['45 Boulevard Raspail'],
    expenses: [{ id: 'exp-1', amount: 50, currency: 'EUR', categoryId: 'cat-1', date: '2026-05-02', paidBy: 'trav-1', splitAmong: ['trav-1', 'trav-2'] }],
    checklistItems: [
      { id: 'check-1', travelerId: 'trav-1', text: 'Passport', category: 'Documents', quantity: 1, done: false },
      { id: 'check-2', travelerId: 'trav-2', text: 'Charger', category: 'Electronics', quantity: 1, done: true },
    ],
    shareSettings: { enabled: true, includedTabs: ['overview', 'itinerary'], shareToken: 'secret-token-123' },
    schemaVersion: 2,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Trip;
}

describe('cloneTripForDuplication', () => {
  it('gives the duplicate a new trip id', () => {
    const original = makeFullTrip();
    const clone = cloneTripForDuplication(original);
    expect(clone.id).not.toBe(original.id);
    expect(clone.id).toBeTruthy();
  });

  it('names the duplicate "<original title> Copy"', () => {
    const clone = cloneTripForDuplication(makeFullTrip({ title: 'Paris Trip' }));
    expect(clone.title).toBe('Paris Trip Copy');
  });

  it('does not mutate the original trip object at all', () => {
    const original = makeFullTrip();
    const snapshot = JSON.parse(JSON.stringify(original));
    cloneTripForDuplication(original);
    expect(original).toEqual(snapshot);
  });

  it('copies basic trip metadata (description, home currency)', () => {
    const original = makeFullTrip();
    const clone = cloneTripForDuplication(original);
    expect(clone.description).toBe(original.description);
    expect(clone.homeCurrency).toBe(original.homeCurrency);
  });

  it('clones legs with new ids but the same content', () => {
    const original = makeFullTrip();
    const clone = cloneTripForDuplication(original);
    expect(clone.legs).toHaveLength(1);
    expect(clone.legs[0]!.id).not.toBe(original.legs[0]!.id);
    expect(clone.legs[0]!.city).toBe('Paris');
    expect(clone.legs[0]!.startDate).toBe(original.legs[0]!.startDate);
  });

  it('clones travelers with new ids but the same names', () => {
    const original = makeFullTrip();
    const clone = cloneTripForDuplication(original);
    expect(clone.travelers.map((t) => t.name)).toEqual(['Alex', 'Sam']);
    expect(clone.travelers.map((t) => t.id)).not.toEqual(original.travelers.map((t) => t.id));
  });

  it('clones flights with a new id and a remapped legId', () => {
    const original = makeFullTrip();
    const clone = cloneTripForDuplication(original);
    expect(clone.flights).toHaveLength(1);
    expect(clone.flights[0]!.id).not.toBe(original.flights[0]!.id);
    expect(clone.flights[0]!.airline).toBe('Air France');
    expect(clone.flights[0]!.legId).toBe(clone.legs[0]!.id);
    expect(clone.flights[0]!.legId).not.toBe(original.legs[0]!.id);
  });

  it('clones stays with a new id and a remapped legId', () => {
    const original = makeFullTrip();
    const clone = cloneTripForDuplication(original);
    expect(clone.stays[0]!.id).not.toBe(original.stays[0]!.id);
    expect(clone.stays[0]!.name).toBe('Hotel Lutetia');
    expect(clone.stays[0]!.legId).toBe(clone.legs[0]!.id);
  });

  it('clones booking items with a new id, remapped legId, and an independent details object', () => {
    const original = makeFullTrip();
    const clone = cloneTripForDuplication(original);
    expect(clone.bookingItems[0]!.id).not.toBe(original.bookingItems[0]!.id);
    expect(clone.bookingItems[0]!.name).toBe('Le Comptoir');
    expect(clone.bookingItems[0]!.legId).toBe(clone.legs[0]!.id);
    expect(clone.bookingItems[0]!.details).toEqual(original.bookingItems[0]!.details);
    expect(clone.bookingItems[0]!.details).not.toBe(original.bookingItems[0]!.details);
  });

  it('clones itinerary stops with a new id, remapped legId, and remapped travelerIds', () => {
    const original = makeFullTrip();
    const clone = cloneTripForDuplication(original);
    const stop = clone.itineraryStops[0]!;
    expect(stop.id).not.toBe(original.itineraryStops[0]!.id);
    expect(stop.title).toBe('Louvre');
    expect(stop.legId).toBe(clone.legs[0]!.id);
    expect(stop.travelerIds).toEqual([clone.travelers[0]!.id, clone.travelers[1]!.id]);
    expect(stop.travelerIds).not.toContain(original.travelers[0]!.id);
    expect(stop.travelerIds).not.toContain(original.travelers[1]!.id);
  });

  it('clones ideas (trip-owned backlog) with new ids', () => {
    const original = makeFullTrip();
    const clone = cloneTripForDuplication(original);
    expect(clone.ideas[0]!.id).not.toBe(original.ideas[0]!.id);
    expect(clone.ideas[0]!.title).toBe('Eiffel Tower at night');
  });

  it('clones budget categories (new ids) and the overall budget target, but not expenses', () => {
    const original = makeFullTrip();
    const clone = cloneTripForDuplication(original);
    expect(clone.budgetCategories[0]!.id).not.toBe(original.budgetCategories[0]!.id);
    expect(clone.budgetCategories[0]!.name).toBe('Food');
    expect(clone.budget).toBe(2000);
    expect(clone.expenses).toEqual([]);
  });

  it('clones checklist items with new ids, and remaps their traveler references to the duplicated travelers', () => {
    const original = makeFullTrip();
    const clone = cloneTripForDuplication(original);
    expect(clone.checklistItems).toHaveLength(2);
    expect(clone.checklistItems.map((c) => c.id)).not.toEqual(original.checklistItems.map((c) => c.id));
    expect(clone.checklistItems[0]!.travelerId).toBe(clone.travelers[0]!.id);
    expect(clone.checklistItems[1]!.travelerId).toBe(clone.travelers[1]!.id);
    expect(clone.checklistItems.map((c) => c.travelerId)).not.toContain(original.travelers[0]!.id);
    expect(clone.checklistItems.map((c) => c.travelerId)).not.toContain(original.travelers[1]!.id);
  });

  it('clones trip-owned remembered locations verbatim', () => {
    const original = makeFullTrip();
    const clone = cloneTripForDuplication(original);
    expect(clone.rememberedLocations).toEqual(['45 Boulevard Raspail']);
  });

  it('no cloned entity retains any id from the original trip', () => {
    const original = makeFullTrip();
    const clone = cloneTripForDuplication(original);
    const originalIds = new Set([
      original.id,
      ...original.legs.map((l) => l.id),
      ...original.travelers.map((t) => t.id),
      ...original.flights.map((f) => f.id),
      ...original.stays.map((s) => s.id),
      ...original.bookingItems.map((b) => b.id),
      ...original.itineraryStops.map((s) => s.id),
      ...original.ideas.map((i) => i.id),
      ...original.budgetCategories.map((c) => c.id),
      ...original.checklistItems.map((c) => c.id),
    ]);
    const cloneIds = [
      clone.id,
      ...clone.legs.map((l) => l.id),
      ...clone.travelers.map((t) => t.id),
      ...clone.flights.map((f) => f.id),
      ...clone.stays.map((s) => s.id),
      ...clone.bookingItems.map((b) => b.id),
      ...clone.itineraryStops.map((s) => s.id),
      ...clone.ideas.map((i) => i.id),
      ...clone.budgetCategories.map((c) => c.id),
      ...clone.checklistItems.map((c) => c.id),
    ];
    for (const id of cloneIds) {
      expect(originalIds.has(id)).toBe(false);
    }
  });

  it('does not copy the sharing token or share state', () => {
    const original = makeFullTrip();
    const clone = cloneTripForDuplication(original);
    expect(clone.shareSettings).toEqual({ enabled: false, includedTabs: [] });
  });

  it('does not copy documents or the cover photo — both are storage references scoped to the original trip', () => {
    const original = makeFullTrip();
    const clone = cloneTripForDuplication(original);
    expect(clone.documents).toEqual([]);
    expect(clone.coverPhotoPath).toBeUndefined();
  });

  it('starts unarchived and with a fresh createdAt, regardless of the original', () => {
    const original = makeFullTrip({ archived: true, createdAt: '2020-01-01T00:00:00Z' });
    const clone = cloneTripForDuplication(original);
    expect(clone.archived).toBe(false);
    expect(clone.createdAt).not.toBe(original.createdAt);
  });

  describe('isolation: mutating the duplicate never mutates the original', () => {
    it('mutating a cloned booking item\'s nested details object leaves the original details untouched', () => {
      const original = makeFullTrip();
      const clone = cloneTripForDuplication(original);
      clone.bookingItems[0]!.details.cuisineType = 'Changed';
      expect(original.bookingItems[0]!.details.cuisineType).toBe('French');
    });

    it('mutating a cloned itinerary stop\'s travelerIds array leaves the original array untouched', () => {
      const original = makeFullTrip();
      const clone = cloneTripForDuplication(original);
      clone.itineraryStops[0]!.travelerIds.push('injected-id');
      expect(original.itineraryStops[0]!.travelerIds).toEqual(['trav-1', 'trav-2']);
    });

    it('mutating the clone\'s rememberedLocations array leaves the original array untouched', () => {
      const original = makeFullTrip();
      const clone = cloneTripForDuplication(original);
      clone.rememberedLocations.push('Somewhere else');
      expect(original.rememberedLocations).toEqual(['45 Boulevard Raspail']);
    });

    it('editing a cloned traveler\'s name leaves the original traveler untouched', () => {
      const original = makeFullTrip();
      const clone = cloneTripForDuplication(original);
      clone.travelers[0]!.name = 'Changed Name';
      expect(original.travelers[0]!.name).toBe('Alex');
    });
  });

  it('drops (rather than mis-references) a checklist item whose travelerId does not match any traveler on the trip', () => {
    const original = makeFullTrip({ checklistItems: [{ id: 'orphan', travelerId: 'ghost-traveler', text: 'Orphaned', category: 'Misc', quantity: 1, done: false }] });
    const clone = cloneTripForDuplication(original);
    expect(clone.checklistItems).toEqual([]);
  });

  it('handles a trip with no legs/flights/stays/etc. without throwing', () => {
    const empty = makeFullTrip({
      legs: [],
      flights: [],
      stays: [],
      bookingItems: [],
      documents: [],
      itineraryStops: [],
      ideas: [],
      budgetCategories: [],
      expenses: [],
      checklistItems: [],
      rememberedLocations: [],
    });
    expect(() => cloneTripForDuplication(empty)).not.toThrow();
    const clone = cloneTripForDuplication(empty);
    expect(clone.itineraryStops).toEqual([]);
  });
});
