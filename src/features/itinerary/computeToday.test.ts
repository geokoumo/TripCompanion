import { describe, expect, it } from 'vitest';
import { computeToday } from './lib/computeToday';
import type { ItineraryStop } from './types';
import type { Flight } from '../flights/types';
import type { Stay } from '../stays/types';

const DATE = '2026-09-06';

function makeStop(overrides: Partial<ItineraryStop> = {}): ItineraryStop {
  return {
    id: 's1',
    date: DATE,
    time: '10:00',
    allDay: false,
    title: 'Colosseum',
    type: 'sight',
    travelerIds: [],
    done: false,
    ...overrides,
  };
}

function makeFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: 'f1',
    airline: 'Aegean',
    flightNumber: 'A3600',
    depAirport: 'ATH',
    depDate: DATE,
    depTime: '08:00',
    arrAirport: 'FCO',
    arrDate: DATE,
    arrTime: '10:00',
    status: 'scheduled',
    ...overrides,
  };
}

function makeStay(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 'st1',
    name: 'Hotel Azul',
    address: '123 Main St',
    checkinDate: DATE,
    checkinTime: '15:00',
    checkoutDate: '2026-09-09',
    checkoutTime: '11:00',
    ...overrides,
  };
}

describe('computeToday', () => {
  it('returns everything empty for a day with nothing scheduled', () => {
    const report = computeToday({ date: DATE, stops: [], flights: [], stays: [], nowTime: '12:00' });
    expect(report).toEqual({ allDayStops: [], completed: [], highlight: null, highlightStatus: null, later: [] });
  });

  it('separates an all-day stop into its own bucket, untouched by the clock', () => {
    const allDay = makeStop({ id: 'ad1', allDay: true, time: undefined });
    const report = computeToday({ date: DATE, stops: [allDay], flights: [], stays: [], nowTime: '00:00' });
    expect(report.allDayStops).toEqual([allDay]);
    expect(report.completed).toEqual([]);
    expect(report.highlight).toBeNull();
  });

  it('marks a timed stop as completed once its end time has passed', () => {
    const stop = makeStop({ time: '09:00', durationMinutes: 60 }); // 09:00-10:00
    const report = computeToday({ date: DATE, stops: [stop], flights: [], stays: [], nowTime: '10:30' });
    expect(report.completed).toHaveLength(1);
    expect(report.completed[0]!.data).toEqual({ kind: 'stop', stop });
    expect(report.highlight).toBeNull();
  });

  it('marks a timed stop as current while inside its span', () => {
    const stop = makeStop({ time: '09:00', durationMinutes: 60 }); // 09:00-10:00
    const report = computeToday({ date: DATE, stops: [stop], flights: [], stays: [], nowTime: '09:30' });
    expect(report.highlightStatus).toBe('current');
    expect(report.highlight?.data).toEqual({ kind: 'stop', stop });
    expect(report.completed).toEqual([]);
    expect(report.later).toEqual([]);
  });

  it('treats a stop with no duration as a point event: completed once its start time has passed, never "current"', () => {
    const stop = makeStop({ time: '09:00', durationMinutes: undefined });
    const before = computeToday({ date: DATE, stops: [stop], flights: [], stays: [], nowTime: '08:59' });
    expect(before.highlightStatus).toBe('upNext');

    const atStart = computeToday({ date: DATE, stops: [stop], flights: [], stays: [], nowTime: '09:00' });
    expect(atStart.completed).toHaveLength(1);
    expect(atStart.highlight).toBeNull();
  });

  it('uses "upNext" as the highlight status when nothing is currently in progress', () => {
    const stop = makeStop({ time: '14:00', durationMinutes: 60 });
    const report = computeToday({ date: DATE, stops: [stop], flights: [], stays: [], nowTime: '09:00' });
    expect(report.highlightStatus).toBe('upNext');
    expect(report.highlight?.data).toEqual({ kind: 'stop', stop });
    expect(report.later).toEqual([]);
  });

  it('puts every remaining upcoming item into "later" when there is no current item', () => {
    const first = makeStop({ id: 's1', time: '10:00' });
    const second = makeStop({ id: 's2', time: '12:00' });
    const third = makeStop({ id: 's3', time: '14:00' });
    const report = computeToday({ date: DATE, stops: [first, second, third], flights: [], stays: [], nowTime: '09:00' });
    expect(report.highlight?.id).toBe('stop-s1');
    expect(report.later.map((i) => i.id)).toEqual(['stop-s2', 'stop-s3']);
  });

  it('puts every upcoming item into "later" (none consumed as highlight) when something is currently in progress', () => {
    const current = makeStop({ id: 's1', time: '09:00', durationMinutes: 120 }); // 09:00-11:00
    const next = makeStop({ id: 's2', time: '12:00' });
    const report = computeToday({ date: DATE, stops: [current, next], flights: [], stays: [], nowTime: '10:00' });
    expect(report.highlightStatus).toBe('current');
    expect(report.highlight?.id).toBe('stop-s1');
    expect(report.later.map((i) => i.id)).toEqual(['stop-s2']);
  });

  it('merges auto-pulled flight/stay entries alongside manual stops, sorted chronologically', () => {
    const flight = makeFlight({ depTime: '08:00', arrTime: '10:00' });
    const stay = makeStay({ checkinTime: '15:00' });
    const stop = makeStop({ time: '12:00' });
    const report = computeToday({ date: DATE, stops: [stop], flights: [flight], stays: [stay], nowTime: '00:00' });

    const order = [...report.completed, report.highlight, ...report.later].filter(Boolean).map((i) => i!.id);
    expect(order).toEqual(['flight-dep-f1', 'flight-arr-f1', 'stop-s1', 'stay-checkin-st1']);
  });

  it('excludes items from a different date', () => {
    const stop = makeStop({ date: '2026-09-07' });
    const report = computeToday({ date: DATE, stops: [stop], flights: [], stays: [], nowTime: '12:00' });
    expect(report.allDayStops).toEqual([]);
    expect(report.completed).toEqual([]);
    expect(report.highlight).toBeNull();
  });

  it('excludes a timed stop with no time value even when not marked all-day', () => {
    const stop = makeStop({ time: undefined, allDay: false });
    const report = computeToday({ date: DATE, stops: [stop], flights: [], stays: [], nowTime: '12:00' });
    expect(report.completed).toEqual([]);
    expect(report.highlight).toBeNull();
  });

  it('treats an auto-pulled entry exactly at "now" as completed, not current (point events have no span)', () => {
    const flight = makeFlight({ depTime: '10:00' });
    const report = computeToday({ date: DATE, stops: [], flights: [flight], stays: [], nowTime: '10:00' });
    expect(report.completed.map((i) => i.id)).toContain('flight-dep-f1');
  });
});
