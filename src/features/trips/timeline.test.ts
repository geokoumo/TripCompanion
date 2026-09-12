import { describe, expect, it } from 'vitest';
import { buildTripMoments, formatRelativeMinutes, getCurrentAndNextMoment, minutesUntilMoment } from './lib/timeline';
import type { Flight } from '../flights/types';
import type { Stay } from '../stays/types';
import type { ItineraryStop } from '../itinerary/types';

function makeFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: 'f1',
    airline: 'Aegean',
    flightNumber: 'A3600',
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

function makeStay(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 's1',
    name: 'Hotel Azul',
    address: '123 Main St',
    checkinDate: '2026-09-05',
    checkinTime: '15:00',
    checkoutDate: '2026-09-08',
    checkoutTime: '11:00',
    ...overrides,
  };
}

function makeStop(overrides: Partial<ItineraryStop> = {}): ItineraryStop {
  return {
    id: 'stop1',
    date: '2026-09-06',
    time: '09:00',
    allDay: false,
    title: 'Colosseum',
    type: 'sight',
    travelerIds: [],
    done: false,
    ...overrides,
  };
}

describe('buildTripMoments', () => {
  it('produces one moment per flight departure/arrival and stay check-in/check-out', () => {
    const moments = buildTripMoments([makeFlight()], [makeStay()], []);
    expect(moments).toHaveLength(4);
  });

  it('includes a timed itinerary stop', () => {
    const moments = buildTripMoments([], [], [makeStop()]);
    expect(moments).toEqual([{ id: 'stop-stop1', date: '2026-09-06', time: '09:00', title: 'Colosseum', subtitle: undefined }]);
  });

  it('excludes an all-day stop (it has no single moment)', () => {
    const moments = buildTripMoments([], [], [makeStop({ allDay: true, time: undefined })]);
    expect(moments).toEqual([]);
  });

  it('excludes a stop with no time set, even if not marked all-day', () => {
    const moments = buildTripMoments([], [], [makeStop({ time: undefined })]);
    expect(moments).toEqual([]);
  });

  it('carries the stop location as the subtitle when present', () => {
    const moments = buildTripMoments([], [], [makeStop({ location: 'Rome' })]);
    expect(moments[0]!.subtitle).toBe('Rome');
  });

  it('sorts every moment chronologically across all three sources', () => {
    const flight = makeFlight({ depDate: '2026-09-05', depTime: '10:00', arrDate: '2026-09-05', arrTime: '12:00' });
    const stay = makeStay({ checkinDate: '2026-09-05', checkinTime: '15:00', checkoutDate: '2026-09-08', checkoutTime: '11:00' });
    const stop = makeStop({ date: '2026-09-05', time: '13:00' });
    const moments = buildTripMoments([flight], [stay], [stop]);
    expect(moments.map((m) => `${m.date} ${m.time}`)).toEqual([
      '2026-09-05 10:00', // flight departure
      '2026-09-05 12:00', // flight arrival
      '2026-09-05 13:00', // stop
      '2026-09-05 15:00', // stay check-in
      '2026-09-08 11:00', // stay check-out
    ]);
  });

  it('returns an empty list for a trip with nothing timed', () => {
    expect(buildTripMoments([], [], [])).toEqual([]);
  });
});

describe('getCurrentAndNextMoment', () => {
  const moments = buildTripMoments(
    [makeFlight({ depDate: '2026-09-05', depTime: '10:00', arrDate: '2026-09-05', arrTime: '12:00' })],
    [makeStay({ checkinDate: '2026-09-05', checkinTime: '15:00', checkoutDate: '2026-09-08', checkoutTime: '11:00' })],
    [],
  );

  it('picks the most recent past-or-present moment as current, and the next future one as next', () => {
    const { current, next } = getCurrentAndNextMoment(moments, '2026-09-05', '13:00');
    expect(current?.id).toBe('flight-arr-f1');
    expect(next?.id).toBe('stay-checkin-s1');
  });

  it('treats a moment exactly at "now" as current, not next', () => {
    const { current, next } = getCurrentAndNextMoment(moments, '2026-09-05', '10:00');
    expect(current?.id).toBe('flight-dep-f1');
    expect(next?.id).toBe('flight-arr-f1');
  });

  it('returns current: null when now is before every moment', () => {
    const { current, next } = getCurrentAndNextMoment(moments, '2026-01-01', '00:00');
    expect(current).toBeNull();
    expect(next?.id).toBe('flight-dep-f1');
  });

  it('returns next: null when now is after every moment', () => {
    const { current, next } = getCurrentAndNextMoment(moments, '2027-01-01', '00:00');
    expect(current?.id).toBe('stay-checkout-s1');
    expect(next).toBeNull();
  });

  it('returns both null for an empty moment list', () => {
    expect(getCurrentAndNextMoment([], '2026-09-05', '10:00')).toEqual({ current: null, next: null });
  });
});

describe('minutesUntilMoment', () => {
  it('returns a positive count for a future moment', () => {
    const moment = { id: 'm1', date: '2026-09-05', time: '12:00', title: 'x' };
    expect(minutesUntilMoment(moment, '2026-09-05', '10:00')).toBe(120);
  });

  it('returns a negative count for a past moment', () => {
    const moment = { id: 'm1', date: '2026-09-05', time: '08:00', title: 'x' };
    expect(minutesUntilMoment(moment, '2026-09-05', '10:00')).toBe(-120);
  });

  it('handles a moment on a different day', () => {
    const moment = { id: 'm1', date: '2026-09-06', time: '08:30', title: 'x' };
    expect(minutesUntilMoment(moment, '2026-09-05', '08:30')).toBe(24 * 60);
  });
});

describe('formatRelativeMinutes', () => {
  it('formats under an hour as minutes', () => {
    expect(formatRelativeMinutes(11)).toBe('11 min');
    expect(formatRelativeMinutes(0)).toBe('0 min');
  });

  it('formats an hour or more, under a day, as hours', () => {
    expect(formatRelativeMinutes(60)).toBe('1h');
    expect(formatRelativeMinutes(23 * 60)).toBe('23h');
  });

  it('formats a day or more as days', () => {
    expect(formatRelativeMinutes(24 * 60)).toBe('1d');
    expect(formatRelativeMinutes(3 * 24 * 60)).toBe('3d');
  });

  it('ignores sign — same output for elapsed and remaining', () => {
    expect(formatRelativeMinutes(-11)).toBe('11 min');
    expect(formatRelativeMinutes(-23 * 60)).toBe('23h');
  });
});
