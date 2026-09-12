import { describe, expect, it } from 'vitest';
import { upsertBookingItem } from './bookingRepository';
import type { Trip } from '../../features/trips/types';
import type { BookingItem } from '../../features/bookings/types';

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

function makeBookingItem(overrides: Partial<BookingItem> = {}): BookingItem {
  return {
    id: 'b1',
    type: 'restaurant',
    name: 'Trattoria',
    details: {},
    ...overrides,
  };
}

describe('upsertBookingItem', () => {
  it('adds a new booking item when no id matches', () => {
    const trip = makeTrip();
    const item = makeBookingItem();
    const result = upsertBookingItem(trip, item);
    expect(result.bookingItems).toEqual([item]);
    expect(trip.bookingItems).toEqual([]);
  });

  it('replaces the booking item with a matching id, leaving others alone', () => {
    const trip = { ...makeTrip(), bookingItems: [makeBookingItem({ id: 'b1', name: 'Old' }), makeBookingItem({ id: 'b2', name: 'Keep' })] };
    const updated = makeBookingItem({ id: 'b1', name: 'New' });
    const result = upsertBookingItem(trip, updated);
    expect(result.bookingItems).toEqual([updated, makeBookingItem({ id: 'b2', name: 'Keep' })]);
  });
});
