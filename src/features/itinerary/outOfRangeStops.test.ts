import { describe, expect, it } from 'vitest';
import { findStopsOutOfRange, outOfRangeStopsMessage } from './lib/outOfRangeStops';
import type { Leg } from '../trips/types';
import type { ItineraryStop } from './types';

function leg(overrides: Partial<Leg> = {}): Leg {
  return { id: 'l1', city: 'Rome', country: 'Italy', startDate: '2026-09-05', endDate: '2026-09-12', currency: 'EUR', ...overrides };
}

function stop(overrides: Partial<ItineraryStop> = {}): ItineraryStop {
  return { id: 'a1', date: '2026-09-06', time: '10:00', allDay: false, title: 'Colosseum', type: 'sight', travelerIds: [], done: false, ...overrides };
}

describe('findStopsOutOfRange (F-05)', () => {
  it('returns no stops when every stop falls within the derived range', () => {
    const trip = { legs: [leg()], flights: [], stays: [], itineraryStops: [stop({ date: '2026-09-06' }), stop({ id: 'a2', date: '2026-09-12' })] };
    expect(findStopsOutOfRange(trip)).toEqual([]);
  });

  it('flags a stop that falls outside the current range', () => {
    const trip = { legs: [leg()], flights: [], stays: [], itineraryStops: [stop({ id: 'a1', date: '2026-01-01' })] };
    expect(findStopsOutOfRange(trip).map((s) => s.id)).toEqual(['a1']);
  });

  it('flags a stop that only becomes out-of-range after a stay/flight edit shrinks the range', () => {
    // Range was legs-only [09-05, 09-12] plus a stay extending it to 09-15 —
    // the stop at 09-14 was valid; after the stay is edited back down to
    // 09-10 (no longer extending anything), it becomes out of range.
    const beforeShrink = {
      legs: [leg()],
      flights: [],
      stays: [{ id: 's1', name: 'Hotel', address: 'Addr', checkinDate: '2026-09-12', checkinTime: '14:00', checkoutDate: '2026-09-15', checkoutTime: '11:00' }],
      itineraryStops: [stop({ id: 'a1', date: '2026-09-14' })],
    };
    expect(findStopsOutOfRange(beforeShrink)).toEqual([]);

    const afterShrink = { ...beforeShrink, stays: [{ ...beforeShrink.stays[0]!, checkoutDate: '2026-09-10' }] };
    expect(findStopsOutOfRange(afterShrink).map((s) => s.id)).toEqual(['a1']);
  });

  it('returns no stops when there is nothing to derive a range from', () => {
    const trip = { legs: [], flights: [], stays: [], itineraryStops: [stop()] };
    expect(findStopsOutOfRange(trip)).toEqual([]);
  });
});

describe('outOfRangeStopsMessage', () => {
  it('returns null for an empty list', () => {
    expect(outOfRangeStopsMessage([])).toBeNull();
  });

  it('uses singular wording for exactly one stop', () => {
    expect(outOfRangeStopsMessage([stop()])).toBe('1 itinerary stop now falls outside the trip dates. Check Trip Health.');
  });

  it('uses plural wording for more than one stop', () => {
    expect(outOfRangeStopsMessage([stop({ id: 'a1' }), stop({ id: 'a2' })])).toBe('2 itinerary stops now fall outside the trip dates. Check Trip Health.');
  });
});
