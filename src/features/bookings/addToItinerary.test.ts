import { describe, expect, it } from 'vitest';
import { buildLinkedItineraryStop } from './lib/addToItinerary';
import type { BookingItem } from './types';
import type { Trip } from '../trips/types';

function trip(overrides: Partial<Trip> = {}): Trip {
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
    ...overrides,
  };
}

function bookingItem(overrides: Partial<BookingItem> = {}): BookingItem {
  return {
    id: 'item1',
    type: 'sight',
    name: 'Sensō-ji Temple',
    details: {},
    ...overrides,
  };
}

describe('buildLinkedItineraryStop', () => {
  it('refuses with a clear message instead of silently doing nothing when date is missing', () => {
    const result = buildLinkedItineraryStop(trip(), bookingItem({ startTime: '10:00' }));
    expect(result).toEqual({ conflictMessage: 'Add a date and start time to add this to the itinerary.' });
  });

  it('refuses with a clear message instead of silently doing nothing when start time is missing', () => {
    const result = buildLinkedItineraryStop(trip(), bookingItem({ date: '2026-09-10' }));
    expect(result).toEqual({ conflictMessage: 'Add a date and start time to add this to the itinerary.' });
  });

  it('builds a stop from the booking item fields when date and start time are set', () => {
    const item = bookingItem({ date: '2026-09-10', startTime: '10:00', endTime: '11:30', location: 'Asakusa' });
    const result = buildLinkedItineraryStop(trip(), item);
    expect(result).toEqual({
      stop: {
        id: expect.any(String),
        legId: undefined,
        date: '2026-09-10',
        time: '10:00',
        allDay: false,
        durationMinutes: 90,
        title: 'Sensō-ji Temple',
        type: 'sight',
        location: 'Asakusa',
        travelerIds: [],
        done: false,
      },
    });
  });

  it('falls back to a 60-minute default duration when no end time is given', () => {
    const item = bookingItem({ date: '2026-09-10', startTime: '10:00' });
    const result = buildLinkedItineraryStop(trip(), item);
    expect('stop' in result && result.stop.durationMinutes).toBe(60);
  });

  it('clamps a nonsensical end time to a minimum 15-minute duration rather than a negative span', () => {
    const item = bookingItem({ date: '2026-09-10', startTime: '10:00', endTime: '10:05' });
    const result = buildLinkedItineraryStop(trip(), item);
    expect('stop' in result && result.stop.durationMinutes).toBe(15);
  });

  it('maps each booking type to its itinerary stop type', () => {
    const restaurant = bookingItem({ type: 'restaurant', date: '2026-09-10', startTime: '19:00' });
    const bar = bookingItem({ type: 'bar', date: '2026-09-10', startTime: '22:00' });
    const transport = bookingItem({ type: 'transport', date: '2026-09-10', startTime: '08:00' });

    expect('stop' in buildLinkedItineraryStop(trip(), restaurant) && (buildLinkedItineraryStop(trip(), restaurant) as { stop: { type: string } }).stop.type).toBe('food');
    expect('stop' in buildLinkedItineraryStop(trip(), bar) && (buildLinkedItineraryStop(trip(), bar) as { stop: { type: string } }).stop.type).toBe('rest');
    expect('stop' in buildLinkedItineraryStop(trip(), transport) && (buildLinkedItineraryStop(trip(), transport) as { stop: { type: string } }).stop.type).toBe('transport');
  });

  it('refuses to create a stop that overlaps an existing occupied slot', () => {
    const t = trip({
      itineraryStops: [
        {
          id: 'existing',
          date: '2026-09-10',
          time: '10:00',
          allDay: false,
          durationMinutes: 60,
          title: 'Existing stop',
          type: 'sight',
          travelerIds: [],
          done: false,
        },
      ],
    });
    const item = bookingItem({ date: '2026-09-10', startTime: '10:30', endTime: '11:00' });
    const result = buildLinkedItineraryStop(t, item);
    expect(result).toEqual({ conflictMessage: expect.stringContaining('Existing stop') });
  });

  it('allows a non-overlapping slot on the same day as an existing stop', () => {
    const t = trip({
      itineraryStops: [
        {
          id: 'existing',
          date: '2026-09-10',
          time: '10:00',
          allDay: false,
          durationMinutes: 60,
          title: 'Existing stop',
          type: 'sight',
          travelerIds: [],
          done: false,
        },
      ],
    });
    const item = bookingItem({ date: '2026-09-10', startTime: '12:00', endTime: '13:00' });
    const result = buildLinkedItineraryStop(t, item);
    expect('stop' in result).toBe(true);
  });
});
