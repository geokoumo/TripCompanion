import { describe, expect, it } from 'vitest';
import { validateTrip } from './validateTrip';
import type { Activity, Stay, Trip } from './schemas';

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'a1',
    title: 'Museum',
    type: 'sight',
    date: '2026-09-06',
    allDay: false,
    time: '15:00',
    durationMinutes: 60,
    travelerIds: [],
    done: false,
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

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Japan',
    startDate: '2026-09-05',
    endDate: '2026-09-12',
    homeCurrency: 'EUR',
    travelers: [{ id: 'tr1', name: 'Nikos' }],
    activities: [],
    flights: [],
    stays: [],
    bookings: [],
    documents: [],
    expenses: [],
    packingItems: [],
    ...overrides,
  };
}

describe('validateTrip', () => {
  it('returns no errors for a minimal, fully valid trip', () => {
    expect(validateTrip(makeTrip())).toEqual([]);
  });

  it('flags a trip missing its own required fields', () => {
    const trip = makeTrip({ title: '' });
    const errors = validateTrip(trip);
    expect(errors).toContainEqual({ code: 'MISSING_REQUIRED_DATA', field: 'title' });
  });

  it('flags an invalid trip startDate', () => {
    const trip = makeTrip({ startDate: 'not-a-date' });
    const errors = validateTrip(trip);
    expect(errors).toContainEqual({ code: 'INVALID_DATE', field: 'startDate' });
  });

  it('surfaces a per-activity error tagged with that activity\'s id', () => {
    const trip = makeTrip({ activities: [makeActivity({ id: 'a1', title: '' })] });
    const errors = validateTrip(trip);
    expect(errors).toContainEqual({ code: 'MISSING_REQUIRED_DATA', field: 'title', entityId: 'a1' });
  });

  it('flags an activity dated outside the trip range', () => {
    const trip = makeTrip({ activities: [makeActivity({ id: 'a1', date: '2026-01-01' })] });
    const errors = validateTrip(trip);
    expect(errors).toContainEqual(expect.objectContaining({ code: 'DATE_OUT_OF_RANGE', entityId: 'a1' }));
  });

  it('detects overlapping activities across the whole trip, tagging both sides', () => {
    const a = makeActivity({ id: 'a1', date: '2026-09-06', time: '15:00', durationMinutes: 60 });
    const b = makeActivity({ id: 'a2', date: '2026-09-06', time: '15:30', durationMinutes: 60 });
    const trip = makeTrip({ activities: [a, b] });
    const errors = validateTrip(trip);

    expect(errors).toContainEqual({ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'a2', entityId: 'a1' });
    expect(errors).toContainEqual({ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'a1', entityId: 'a2' });
  });

  it('does not flag back-to-back activities as overlapping', () => {
    const a = makeActivity({ id: 'a1', date: '2026-09-06', time: '15:00', durationMinutes: 120 });
    const b = makeActivity({ id: 'a2', date: '2026-09-06', time: '17:00', durationMinutes: 60 });
    const trip = makeTrip({ activities: [a, b] });
    expect(validateTrip(trip)).toEqual([]);
  });

  it('detects overlapping stays, tagging both sides with STAY_OVERLAP', () => {
    const s1 = makeStay({ id: 's1', checkinDate: '2026-09-05', checkoutDate: '2026-09-08' });
    const s2 = makeStay({ id: 's2', checkinDate: '2026-09-07', checkoutDate: '2026-09-10' });
    const trip = makeTrip({ stays: [s1, s2] });
    const errors = validateTrip(trip);

    expect(errors).toContainEqual({ code: 'STAY_OVERLAP', field: 'checkinDate', conflictingId: 's2', entityId: 's1' });
    expect(errors).toContainEqual({ code: 'STAY_OVERLAP', field: 'checkinDate', conflictingId: 's1', entityId: 's2' });
  });

  it('does not require stays to fall inside the trip date range', () => {
    // Check-in the evening before day one, check-out the morning after the last day.
    const stay = makeStay({ id: 's1', checkinDate: '2026-09-04', checkoutDate: '2026-09-13' });
    const trip = makeTrip({ stays: [stay] });
    expect(validateTrip(trip)).toEqual([]);
  });

  it('aggregates errors from multiple unrelated activities independently', () => {
    const badDate = makeActivity({ id: 'a1', date: '1900-01-01' });
    const badTime = makeActivity({ id: 'a2', date: '2026-09-06', time: 'nope' });
    const fine = makeActivity({ id: 'a3', date: '2026-09-07', time: '10:00', durationMinutes: 30 });
    const trip = makeTrip({ activities: [badDate, badTime, fine] });
    const errors = validateTrip(trip);

    expect(errors.some((e) => e.entityId === 'a1' && e.code === 'DATE_OUT_OF_RANGE')).toBe(true);
    expect(errors.some((e) => e.entityId === 'a2' && e.code === 'INVALID_TIME_RANGE')).toBe(true);
    expect(errors.some((e) => e.entityId === 'a3')).toBe(false);
  });

  it('skips activity date-range checks entirely when the trip has no valid range', () => {
    const trip = makeTrip({ startDate: 'bad', endDate: 'bad', activities: [makeActivity({ id: 'a1', date: '1900-01-01' })] });
    const errors = validateTrip(trip);
    expect(errors.some((e) => e.code === 'DATE_OUT_OF_RANGE')).toBe(false);
  });
});
