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

  // Item F: renaming a booking item must not orphan its attached documents
  // from the item's own View Details (which matches by exact relatedTo label).
  it('retags a document attached to a booking item when the item is renamed', () => {
    const trip = {
      ...makeTrip(),
      bookingItems: [makeBookingItem({ id: 'b1', name: 'Old Name' })],
      documents: [{ id: 'd1', category: 'other' as const, title: 'ticket.pdf', relatedTo: 'Old Name', fileType: 'pdf' as const, storagePath: 'p', uploadedAt: '2026-09-01' }],
    };
    const renamed = makeBookingItem({ id: 'b1', name: 'New Name' });
    const result = upsertBookingItem(trip, renamed);
    expect(result.documents[0]!.relatedTo).toBe('New Name');
    expect(result.documents).toHaveLength(1);
  });

  it('does not touch documents when the booking item is updated without changing its relatedTo label', () => {
    const trip = {
      ...makeTrip(),
      bookingItems: [makeBookingItem({ id: 'b1', name: 'Trattoria' })],
      documents: [{ id: 'd1', category: 'other' as const, title: 'ticket.pdf', relatedTo: 'Trattoria', fileType: 'pdf' as const, storagePath: 'p', uploadedAt: '2026-09-01' }],
    };
    const updated = makeBookingItem({ id: 'b1', name: 'Trattoria', notes: 'Great pasta' });
    const result = upsertBookingItem(trip, updated);
    expect(result.documents[0]!.relatedTo).toBe('Trattoria');
  });
});
