import { describe, expect, it } from 'vitest';
import { computeOccupiedRanges, findConflict, formatRangeLabel } from './lib/occupiedRanges';
import type { ItineraryStop } from './types';
import type { Flight } from '../flights/types';
import type { Stay } from '../stays/types';

function stop(overrides: Partial<ItineraryStop>): ItineraryStop {
  return {
    id: 'stop',
    date: '2026-09-06',
    time: '10:00',
    allDay: false,
    durationMinutes: 60,
    title: 'Stop',
    type: 'sight',
    travelerIds: [],
    done: false,
    ...overrides,
  };
}

function flight(overrides: Partial<Flight>): Flight {
  return {
    id: 'flight',
    airline: 'Test Air',
    flightNumber: 'TA1',
    depAirport: 'ATH',
    depDate: '2026-09-05',
    depTime: '23:40',
    arrAirport: 'NRT',
    arrDate: '2026-09-06',
    arrTime: '06:15',
    status: 'scheduled',
    ...overrides,
  };
}

function stay(overrides: Partial<Stay>): Stay {
  return {
    id: 'stay',
    name: 'Hotel',
    address: 'Addr',
    checkinDate: '2026-09-06',
    checkinTime: '15:00',
    checkoutDate: '2026-09-10',
    checkoutTime: '11:00',
    ...overrides,
  };
}

describe('computeOccupiedRanges', () => {
  it('splits a flight spanning midnight across the two calendar days it touches', () => {
    const f = flight({});
    const departureDay = computeOccupiedRanges({ date: '2026-09-05', stops: [], flights: [f], stays: [] });
    expect(departureDay).toEqual([{ startMin: 23 * 60 + 40, endMin: 24 * 60, label: 'Test Air TA1' }]);

    const arrivalDay = computeOccupiedRanges({ date: '2026-09-06', stops: [], flights: [f], stays: [] });
    expect(arrivalDay).toEqual([{ startMin: 0, endMin: 6 * 60 + 15, label: 'Test Air TA1' }]);
  });

  it('keeps a same-day flight as a single simple span', () => {
    const f = flight({ depDate: '2026-09-06', depTime: '09:00', arrDate: '2026-09-06', arrTime: '11:00' });
    const ranges = computeOccupiedRanges({ date: '2026-09-06', stops: [], flights: [f], stays: [] });
    expect(ranges).toEqual([{ startMin: 9 * 60, endMin: 11 * 60, label: 'Test Air TA1' }]);
  });

  it('blocks only the exact instant of a stay check-in/check-out, not a range', () => {
    const s = stay({});
    const checkinDay = computeOccupiedRanges({ date: '2026-09-06', stops: [], flights: [], stays: [s] });
    expect(checkinDay).toEqual([{ startMin: 15 * 60, endMin: 15 * 60 + 1, label: 'Check-in — Hotel' }]);

    const checkoutDay = computeOccupiedRanges({ date: '2026-09-10', stops: [], flights: [], stays: [s] });
    expect(checkoutDay).toEqual([{ startMin: 11 * 60, endMin: 11 * 60 + 1, label: 'Check-out — Hotel' }]);
  });

  it('never lets an all-day stop participate in blocking', () => {
    const stops = [stop({ id: 'allday', allDay: true, time: undefined, durationMinutes: undefined })];
    expect(computeOccupiedRanges({ date: '2026-09-06', stops, flights: [], stays: [] })).toEqual([]);
  });

  it('excludes the stop currently being edited from its own occupied set', () => {
    const stops = [stop({ id: 'self', time: '10:00', durationMinutes: 60 })];
    expect(computeOccupiedRanges({ date: '2026-09-06', stops, flights: [], stays: [], excludeStopId: 'self' })).toEqual([]);
  });

  it('includes a manual timed stop with a duration as [time, time+duration)', () => {
    const stops = [stop({ id: 'other', time: '14:00', durationMinutes: 90, title: 'Ginza βραδινή βόλτα' })];
    const ranges = computeOccupiedRanges({ date: '2026-09-06', stops, flights: [], stays: [] });
    expect(ranges).toEqual([{ startMin: 14 * 60, endMin: 15 * 60 + 30, label: 'Ginza βραδινή βόλτα' }]);
  });
});

describe('findConflict', () => {
  it('finds the range a candidate span intersects', () => {
    const ranges = [{ startMin: 20 * 60, endMin: 21 * 60, label: 'Ginza βραδινή βόλτα' }];
    expect(findConflict(20 * 60 + 30, 30, ranges)).toEqual(ranges[0]);
    expect(findConflict(21 * 60, 30, ranges)).toBeUndefined();
  });
});

describe('formatRangeLabel', () => {
  it('shows a single time for a point event', () => {
    expect(formatRangeLabel({ startMin: 15 * 60, endMin: 15 * 60 + 1, label: 'x' })).toBe('(15:00)');
  });

  it('shows a range for a real span', () => {
    expect(formatRangeLabel({ startMin: 20 * 60, endMin: 21 * 60, label: 'x' })).toBe('(20:00–21:00)');
  });
});
