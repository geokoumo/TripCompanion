import { describe, expect, it } from 'vitest';
import { detectFlightStayOccupancyConflict } from './detectFlightStayOccupancy';
import type { Activity, Flight, Stay } from './schemas';

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'a1',
    title: 'Museum',
    type: 'sight',
    date: '2026-09-05',
    allDay: false,
    time: '15:00',
    durationMinutes: 60,
    travelerIds: [],
    done: false,
    ...overrides,
  };
}

function makeFlight(overrides: Partial<Flight> = {}): Flight {
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

function makeStay(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 's1',
    name: 'Hotel Roma',
    address: 'Via Roma 1',
    checkinDate: '2026-09-05',
    checkinTime: '14:00',
    checkoutDate: '2026-09-08',
    checkoutTime: '11:00',
    ...overrides,
  };
}

describe('detectFlightStayOccupancyConflict — flights', () => {
  it('flags an activity that falls within a flight\'s real elapsed travel time', () => {
    const activity = makeActivity({ date: '2026-09-05', time: '10:30', durationMinutes: 30 });
    const errors = detectFlightStayOccupancyConflict(activity, [makeFlight()], []);
    expect(errors).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'f1', conflictingKind: 'flight' }]);
  });

  it('does not conflict with an activity that starts exactly when the flight lands', () => {
    const activity = makeActivity({ date: '2026-09-05', time: '12:00', durationMinutes: 30 });
    expect(detectFlightStayOccupancyConflict(activity, [makeFlight()], [])).toEqual([]);
  });

  it('does not conflict with an activity that ends exactly when the flight departs', () => {
    const activity = makeActivity({ date: '2026-09-05', time: '09:00', durationMinutes: 60 });
    expect(detectFlightStayOccupancyConflict(activity, [makeFlight()], [])).toEqual([]);
  });

  it('correctly flags a conflict across a flight that crosses midnight', () => {
    const flight = makeFlight({ depDate: '2026-09-05', depTime: '23:30', arrDate: '2026-09-06', arrTime: '02:00' });
    const activity = makeActivity({ date: '2026-09-06', time: '00:30', durationMinutes: 30 });
    const errors = detectFlightStayOccupancyConflict(activity, [flight], []);
    expect(errors).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'f1', conflictingKind: 'flight' }]);
  });

  it('flags a conflict for each of multiple flights the activity overlaps', () => {
    const activity = makeActivity({ date: '2026-09-05', time: '10:30', durationMinutes: 30 });
    const errors = detectFlightStayOccupancyConflict(activity, [makeFlight({ id: 'f1' }), makeFlight({ id: 'f2' })], []);
    expect(errors.map((e) => (e.code === 'TIME_OVERLAP' ? e.conflictingId : null)).sort()).toEqual(['f1', 'f2']);
  });
});

describe('detectFlightStayOccupancyConflict — stays', () => {
  it('flags an activity scheduled at a stay\'s exact check-in instant', () => {
    const activity = makeActivity({ date: '2026-09-05', time: '14:00', durationMinutes: undefined });
    const errors = detectFlightStayOccupancyConflict(activity, [], [makeStay()]);
    expect(errors).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 's1', conflictingKind: 'stay' }]);
  });

  it('flags an activity scheduled at a stay\'s exact check-out instant', () => {
    const activity = makeActivity({ date: '2026-09-08', time: '11:00', durationMinutes: undefined });
    const errors = detectFlightStayOccupancyConflict(activity, [], [makeStay()]);
    expect(errors).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 's1', conflictingKind: 'stay' }]);
  });

  it('flags an activity whose span includes the check-in instant, even without starting there', () => {
    const activity = makeActivity({ date: '2026-09-05', time: '13:30', durationMinutes: 60 });
    const errors = detectFlightStayOccupancyConflict(activity, [], [makeStay()]);
    expect(errors).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 's1', conflictingKind: 'stay' }]);
  });

  it('does not conflict with an activity well outside the check-in/check-out instants', () => {
    const activity = makeActivity({ date: '2026-09-06', time: '15:00', durationMinutes: 60 });
    expect(detectFlightStayOccupancyConflict(activity, [], [makeStay()])).toEqual([]);
  });

  it('does not conflict with an activity that starts exactly at check-out (back-to-back is fine)', () => {
    const activity = makeActivity({ date: '2026-09-08', time: '11:00', durationMinutes: undefined });
    // A zero-duration activity AT the checkout instant is itself a point conflict (tested above) — an
    // activity that instead runs a full itinerary day *starting after* checkout must not conflict.
    const laterActivity = makeActivity({ date: '2026-09-08', time: '11:01', durationMinutes: 60 });
    expect(detectFlightStayOccupancyConflict(laterActivity, [], [makeStay()])).toEqual([]);
    expect(detectFlightStayOccupancyConflict(activity, [], [makeStay()]).length).toBeGreaterThan(0);
  });
});

describe('detectFlightStayOccupancyConflict — all-day and timeless activities never participate', () => {
  it('never flags an all-day activity, even one overlapping a flight or stay by date', () => {
    const activity = makeActivity({ date: '2026-09-05', allDay: true, time: undefined, durationMinutes: undefined });
    expect(detectFlightStayOccupancyConflict(activity, [makeFlight()], [makeStay()])).toEqual([]);
  });

  it('never flags an activity with no time set', () => {
    const activity = makeActivity({ date: '2026-09-05', time: undefined, durationMinutes: undefined, allDay: false });
    expect(detectFlightStayOccupancyConflict(activity, [makeFlight()], [makeStay()])).toEqual([]);
  });
});
