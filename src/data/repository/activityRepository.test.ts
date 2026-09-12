import { describe, expect, it } from 'vitest';
import { upsertItineraryStop } from './activityRepository';
import type { Trip } from '../../features/trips/types';
import type { ItineraryStop } from '../../features/itinerary/types';

function makeTrip(): Trip {
  return {
    id: 'trip1',
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
  };
}

function makeStop(overrides: Partial<ItineraryStop> = {}): ItineraryStop {
  return {
    id: 's1',
    date: '2026-09-05',
    time: '10:00',
    allDay: false,
    title: 'Colosseum',
    type: 'sight',
    travelerIds: [],
    done: false,
    ...overrides,
  };
}

describe('upsertItineraryStop', () => {
  it('adds a new stop when no id matches', () => {
    const trip = makeTrip();
    const stop = makeStop();
    const result = upsertItineraryStop(trip, stop);
    expect(result.itineraryStops).toEqual([stop]);
    expect(trip.itineraryStops).toEqual([]);
  });

  it('replaces the stop with a matching id, leaving others alone', () => {
    const trip = { ...makeTrip(), itineraryStops: [makeStop({ id: 's1', title: 'Old' }), makeStop({ id: 's2', title: 'Keep' })] };
    const updated = makeStop({ id: 's1', title: 'New' });
    const result = upsertItineraryStop(trip, updated);
    expect(result.itineraryStops).toEqual([updated, makeStop({ id: 's2', title: 'Keep' })]);
  });
});
