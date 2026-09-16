import { describe, expect, it } from 'vitest';
import { getActiveOrNextTrip } from './activeTrip';
import { todayStr } from '../../../shared/lib/dateFormat';
import type { TripListItem } from '../types';

function item(overrides: Partial<TripListItem>): TripListItem {
  return { id: 't1', title: 'Trip', archived: false, startDate: null, endDate: null, cities: [], travelers: [], ...overrides };
}

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

describe('getActiveOrNextTrip', () => {
  it('returns null when there are no trips', () => {
    expect(getActiveOrNextTrip([])).toBeNull();
  });

  it('returns null when every trip is missing dates', () => {
    expect(getActiveOrNextTrip([item({ id: 'a' })])).toBeNull();
  });

  it('ignores archived trips even if their dates would otherwise match', () => {
    const trip = item({ id: 'a', archived: true, startDate: offsetDate(-1), endDate: offsetDate(1) });
    expect(getActiveOrNextTrip([trip])).toBeNull();
  });

  it('prefers a trip whose range contains today over an upcoming one', () => {
    const ongoing = item({ id: 'ongoing', startDate: offsetDate(-2), endDate: offsetDate(2) });
    const upcoming = item({ id: 'upcoming', startDate: offsetDate(5), endDate: offsetDate(10) });
    expect(getActiveOrNextTrip([upcoming, ongoing])?.id).toBe('ongoing');
  });

  it('treats today itself as inside the range on both edges', () => {
    const trip = item({ id: 'a', startDate: todayStr(), endDate: todayStr() });
    expect(getActiveOrNextTrip([trip])?.id).toBe('a');
  });

  it('falls back to the soonest upcoming trip when none are ongoing', () => {
    const soon = item({ id: 'soon', startDate: offsetDate(3), endDate: offsetDate(6) });
    const later = item({ id: 'later', startDate: offsetDate(20), endDate: offsetDate(25) });
    expect(getActiveOrNextTrip([later, soon])?.id).toBe('soon');
  });

  it('returns null when every trip has already ended', () => {
    const past = item({ id: 'past', startDate: offsetDate(-10), endDate: offsetDate(-5) });
    expect(getActiveOrNextTrip([past])).toBeNull();
  });
});
