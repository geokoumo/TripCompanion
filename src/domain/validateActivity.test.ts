import { describe, expect, it } from 'vitest';
import { validateActivity } from './validateActivity';
import type { Activity, DateRange } from './schemas';

const TRIP_RANGE: DateRange = { startDate: '2026-09-05', endDate: '2026-09-12' };

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

describe('validateActivity', () => {
  it('returns no errors for a fully valid, non-conflicting activity', () => {
    expect(validateActivity(makeActivity(), { tripRange: TRIP_RANGE, existingActivities: [] })).toEqual([]);
  });

  it('accepts a valid all-day activity with no time/duration', () => {
    const activity = makeActivity({ allDay: true, time: undefined, durationMinutes: undefined });
    expect(validateActivity(activity, { tripRange: TRIP_RANGE, existingActivities: [] })).toEqual([]);
  });

  it('combines a required-field error with a date-range error', () => {
    const activity = makeActivity({ title: '', date: '2026-09-01' });
    const errors = validateActivity(activity, { tripRange: TRIP_RANGE, existingActivities: [] });
    const codes = errors.map((e) => e.code).sort();
    expect(codes).toEqual(['DATE_OUT_OF_RANGE', 'MISSING_REQUIRED_DATA']);
  });

  it('flags a date outside the trip range', () => {
    const activity = makeActivity({ date: '2026-12-25' });
    const errors = validateActivity(activity, { tripRange: TRIP_RANGE, existingActivities: [] });
    expect(errors).toContainEqual(expect.objectContaining({ code: 'DATE_OUT_OF_RANGE' }));
  });

  it('flags an invalid time range', () => {
    const activity = makeActivity({ time: 'nope' });
    const errors = validateActivity(activity, { tripRange: TRIP_RANGE, existingActivities: [] });
    expect(errors).toContainEqual({ code: 'INVALID_TIME_RANGE', field: 'time' });
  });

  it('flags an invalid duration', () => {
    const activity = makeActivity({ durationMinutes: -10 });
    const errors = validateActivity(activity, { tripRange: TRIP_RANGE, existingActivities: [] });
    expect(errors).toContainEqual({ code: 'INVALID_DURATION', field: 'durationMinutes' });
  });

  it('flags a price given without a currency', () => {
    const activity = makeActivity({ price: 20 });
    const errors = validateActivity(activity, { tripRange: TRIP_RANGE, existingActivities: [] });
    expect(errors).toContainEqual({ code: 'INVALID_CURRENCY', field: 'currency' });
  });

  it('accepts a valid price/currency pair', () => {
    const activity = makeActivity({ price: 20, currency: 'EUR' });
    expect(validateActivity(activity, { tripRange: TRIP_RANGE, existingActivities: [] })).toEqual([]);
  });

  it('flags a blank (but provided) location', () => {
    const activity = makeActivity({ location: '   ' });
    const errors = validateActivity(activity, { tripRange: TRIP_RANGE, existingActivities: [] });
    expect(errors).toContainEqual({ code: 'INVALID_LOCATION', field: 'location' });
  });

  describe('overlap with other activities', () => {
    it('flags a time conflict against an existing activity on the same day', () => {
      const existing = makeActivity({ id: 'other', date: '2026-09-06', time: '15:30', durationMinutes: 30 });
      const candidate = makeActivity({ id: 'a1', date: '2026-09-06', time: '15:00', durationMinutes: 60 });
      const errors = validateActivity(candidate, { tripRange: TRIP_RANGE, existingActivities: [existing] });
      expect(errors).toContainEqual({ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'other' });
    });

    it('EDITING: does not conflict against its own pre-edit self in existingActivities', () => {
      const candidate = makeActivity({ id: 'a1', date: '2026-09-06', time: '15:00', durationMinutes: 60 });
      const preEditSelf = makeActivity({ id: 'a1', date: '2026-09-06', time: '15:00', durationMinutes: 60 });
      const errors = validateActivity(candidate, { tripRange: TRIP_RANGE, existingActivities: [preEditSelf] });
      expect(errors).toEqual([]);
    });

    it('does not flag a conflict against a same-time all-day activity', () => {
      const existing = makeActivity({ id: 'other', date: '2026-09-06', allDay: true, time: undefined, durationMinutes: undefined });
      const candidate = makeActivity({ id: 'a1', date: '2026-09-06', time: '15:00', durationMinutes: 60 });
      const errors = validateActivity(candidate, { tripRange: TRIP_RANGE, existingActivities: [existing] });
      expect(errors).toEqual([]);
    });
  });

  it('accumulates every category of error at once rather than short-circuiting', () => {
    const activity: Activity = {
      id: 'a1',
      title: '',
      type: 'sight',
      date: '1900-01-01',
      allDay: false,
      time: 'bad',
      durationMinutes: -5,
      price: 10,
      location: '  ',
      travelerIds: [],
      done: false,
    };
    const existing = makeActivity({ id: 'other', date: '1900-01-01' });
    const errors = validateActivity(activity, { tripRange: TRIP_RANGE, existingActivities: [existing] });
    const codes = new Set(errors.map((e) => e.code));
    expect(codes).toEqual(
      new Set(['MISSING_REQUIRED_DATA', 'DATE_OUT_OF_RANGE', 'INVALID_TIME_RANGE', 'INVALID_DURATION', 'INVALID_CURRENCY', 'INVALID_LOCATION']),
    );
  });

  it('skips DATE_OUT_OF_RANGE when tripRange is null', () => {
    const activity = makeActivity({ date: '1900-01-01' });
    const errors = validateActivity(activity, { tripRange: null, existingActivities: [] });
    expect(errors).toEqual([]);
  });
});
