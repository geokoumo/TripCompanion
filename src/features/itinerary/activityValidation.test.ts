import { describe, expect, it } from 'vitest';
import { describeActivityError, toDomainActivity, tripActivityRange, validateStopForSave } from './lib/activityValidation';
import type { DomainError } from '../../domain';
import type { Trip } from '../trips/types';
import type { ItineraryStop } from './types';

function makeStop(overrides: Partial<ItineraryStop> = {}): ItineraryStop {
  return {
    id: 'a1',
    date: '2026-09-06',
    time: '10:00',
    allDay: false,
    title: 'Colosseum',
    type: 'sight',
    travelerIds: [],
    done: false,
    ...overrides,
  };
}

function makeTrip(overrides: Partial<Pick<Trip, 'legs' | 'flights'>> = {}): Pick<Trip, 'legs' | 'flights'> {
  return {
    legs: [{ id: 'l1', city: 'Rome', country: 'Italy', startDate: '2026-09-05', endDate: '2026-09-12', currency: 'EUR', exchangeRateToHome: null }],
    flights: [],
    ...overrides,
  };
}

describe('toDomainActivity', () => {
  it('maps a fully-populated stop', () => {
    const stop = makeStop({ location: 'Rome', price: 20, currency: 'EUR', note: 'Bring water', link: 'https://x.com' });
    expect(toDomainActivity(stop)).toEqual({
      id: 'a1',
      title: 'Colosseum',
      type: 'sight',
      date: '2026-09-06',
      allDay: false,
      time: '10:00',
      durationMinutes: undefined,
      location: 'Rome',
      price: 20,
      currency: 'EUR',
      notes: 'Bring water',
      link: 'https://x.com',
      travelerIds: [],
      done: false,
    });
  });

  it('maps a minimal stop with undefined optionals rather than null', () => {
    const stop = makeStop();
    const activity = toDomainActivity(stop);
    expect(activity.location).toBeUndefined();
    expect(activity.price).toBeUndefined();
    expect(activity.currency).toBeUndefined();
    expect(activity.notes).toBeUndefined();
  });
});

describe('tripActivityRange', () => {
  it('derives the range from legs', () => {
    expect(tripActivityRange(makeTrip())).toEqual({ startDate: '2026-09-05', endDate: '2026-09-12' });
  });

  it('returns null when there is nothing to derive a range from', () => {
    expect(tripActivityRange({ legs: [], flights: [] })).toBeNull();
  });
});

describe('validateStopForSave', () => {
  it('returns no errors for a valid, non-conflicting stop', () => {
    expect(validateStopForSave(makeStop(), makeTrip(), [])).toEqual([]);
  });

  it('flags a date outside the trip range', () => {
    const errors = validateStopForSave(makeStop({ date: '2026-01-01' }), makeTrip(), []);
    expect(errors.some((e) => e.code === 'DATE_OUT_OF_RANGE')).toBe(true);
  });

  it('flags a conflict against another stop on the same day', () => {
    const existing = makeStop({ id: 'other', time: '10:30', durationMinutes: 30 });
    const candidate = makeStop({ id: 'a1', time: '10:00', durationMinutes: 60 });
    const errors = validateStopForSave(candidate, makeTrip(), [existing]);
    expect(errors).toContainEqual({ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'other' });
  });

  it('EDITING: does not conflict against its own pre-edit self', () => {
    const preEditSelf = makeStop({ id: 'a1', time: '10:00', durationMinutes: 60 });
    const candidate = makeStop({ id: 'a1', time: '10:00', durationMinutes: 60 });
    expect(validateStopForSave(candidate, makeTrip(), [preEditSelf])).toEqual([]);
  });
});

describe('describeActivityError', () => {
  const stops = [makeStop({ id: 'other', title: 'Trevi Fountain', time: '11:00' })];

  it('describes a missing required field by its label', () => {
    const error: DomainError = { code: 'MISSING_REQUIRED_DATA', field: 'title' };
    expect(describeActivityError(error, stops)).toBe('Title is required.');
  });

  it('falls back to a generic label for an unmapped field', () => {
    const error: DomainError = { code: 'MISSING_REQUIRED_DATA', field: 'somethingElse' };
    expect(describeActivityError(error, stops)).toBe('This field is required.');
  });

  it('explains a date-out-of-range boundary in plain language', () => {
    const error: DomainError = { code: 'DATE_OUT_OF_RANGE', field: 'date', date: '2026-01-01', rangeStart: '2026-09-05', rangeEnd: '2026-09-12' };
    expect(describeActivityError(error, stops)).toBe("Choose a date between 5 Sep and 12 Sep — outside your trip's dates.");
  });

  it('names the conflicting activity by title and time', () => {
    const error: DomainError = { code: 'TIME_OVERLAP', field: 'time', conflictingId: 'other' };
    expect(describeActivityError(error, stops)).toBe('This overlaps with "Trevi Fountain" at 11:00. Change the time or duration.');
  });

  it('falls back to a generic overlap message when the conflicting stop cannot be found', () => {
    const error: DomainError = { code: 'TIME_OVERLAP', field: 'time', conflictingId: 'missing' };
    expect(describeActivityError(error, stops)).toBe('This time overlaps with another activity.');
  });

  it('describes invalid price/currency/location/time/duration', () => {
    expect(describeActivityError({ code: 'INVALID_PRICE', field: 'price' }, stops)).toBe('Enter a valid price (0 or more).');
    expect(describeActivityError({ code: 'INVALID_CURRENCY', field: 'currency' }, stops)).toBe('Enter a 3-letter currency code (e.g. EUR).');
    expect(describeActivityError({ code: 'INVALID_LOCATION', field: 'location' }, stops)).toBe('Location cannot be blank — clear it or fill it in.');
    expect(describeActivityError({ code: 'INVALID_TIME_RANGE', field: 'time' }, stops)).toBe('Enter a valid time.');
    expect(describeActivityError({ code: 'INVALID_DURATION', field: 'durationMinutes' }, stops)).toBe('Duration must be a positive number of minutes.');
    expect(describeActivityError({ code: 'INVALID_DATE', field: 'date' }, stops)).toBe('Enter a valid date.');
  });
});
