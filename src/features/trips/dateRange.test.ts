import { describe, expect, it } from 'vitest';
import { getTripDateRange } from './lib/dateRange';
import type { Flight } from '../flights/types';
import type { Leg } from './types';

function leg(overrides: Partial<Leg> = {}): Leg {
  return { id: 'l1', city: 'Rome', country: 'Italy', startDate: '2026-09-05', endDate: '2026-09-08', currency: 'EUR', ...overrides };
}

function flight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: 'f1',
    airline: 'Test Air',
    flightNumber: 'TA1',
    depAirport: 'ATH',
    depDate: '2026-09-05',
    depTime: '10:00',
    arrAirport: 'FCO',
    arrDate: '2026-09-05',
    arrTime: '12:00',
    status: 'scheduled',
    ...overrides,
  };
}

describe('getTripDateRange', () => {
  it('returns null when there are no legs or flights', () => {
    expect(getTripDateRange([], [])).toBeNull();
  });

  it('spans the min start and max end across multiple legs', () => {
    const range = getTripDateRange([leg({ startDate: '2026-09-05', endDate: '2026-09-08' }), leg({ id: 'l2', startDate: '2026-09-09', endDate: '2026-09-12' })]);
    expect(range).toEqual({ startDate: '2026-09-05', endDate: '2026-09-12' });
  });

  it('extends the range earlier when a flight departs before the first leg starts', () => {
    const range = getTripDateRange([leg({ startDate: '2026-09-05', endDate: '2026-09-08' })], [flight({ depDate: '2026-09-04', arrDate: '2026-09-04' })]);
    expect(range?.startDate).toBe('2026-09-04');
  });

  it('extends the range later when a flight arrives after the last leg ends', () => {
    const range = getTripDateRange([leg({ startDate: '2026-09-05', endDate: '2026-09-08' })], [flight({ depDate: '2026-09-09', arrDate: '2026-09-09' })]);
    expect(range?.endDate).toBe('2026-09-09');
  });

  it('ignores legs with blank dates rather than letting them collapse the range', () => {
    const range = getTripDateRange([leg({ startDate: '', endDate: '' }), leg({ id: 'l2', startDate: '2026-09-05', endDate: '2026-09-08' })]);
    expect(range).toEqual({ startDate: '2026-09-05', endDate: '2026-09-08' });
  });
});
