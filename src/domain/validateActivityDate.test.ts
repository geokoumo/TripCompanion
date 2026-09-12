import { describe, expect, it } from 'vitest';
import { validateActivityDate } from './validateActivityDate';

const RANGE = { startDate: '2026-09-05', endDate: '2026-09-12' };

describe('validateActivityDate', () => {
  it('accepts a date inside the trip range', () => {
    expect(validateActivityDate('2026-09-08', RANGE)).toEqual([]);
  });

  it('accepts a date exactly on the trip start boundary (inclusive)', () => {
    expect(validateActivityDate('2026-09-05', RANGE)).toEqual([]);
  });

  it('accepts a date exactly on the trip end boundary (inclusive)', () => {
    expect(validateActivityDate('2026-09-12', RANGE)).toEqual([]);
  });

  it('rejects a date before the trip range', () => {
    expect(validateActivityDate('2026-09-04', RANGE)).toEqual([
      { code: 'DATE_OUT_OF_RANGE', field: 'date', date: '2026-09-04', rangeStart: RANGE.startDate, rangeEnd: RANGE.endDate },
    ]);
  });

  it('rejects a date after the trip range', () => {
    expect(validateActivityDate('2026-09-13', RANGE)).toEqual([
      { code: 'DATE_OUT_OF_RANGE', field: 'date', date: '2026-09-13', rangeStart: RANGE.startDate, rangeEnd: RANGE.endDate },
    ]);
  });

  it('skips range membership entirely when tripRange is null', () => {
    expect(validateActivityDate('1999-01-01', null)).toEqual([]);
  });

  it('rejects a malformed date string', () => {
    expect(validateActivityDate('09/08/2026', RANGE)).toEqual([{ code: 'INVALID_DATE', field: 'date' }]);
  });

  it('rejects an empty date string', () => {
    expect(validateActivityDate('', RANGE)).toEqual([{ code: 'INVALID_DATE', field: 'date' }]);
  });

  it('rejects a calendrically impossible date (Feb 30)', () => {
    expect(validateActivityDate('2026-02-30', RANGE)).toEqual([{ code: 'INVALID_DATE', field: 'date' }]);
  });

  it('rejects month 13', () => {
    expect(validateActivityDate('2026-13-01', RANGE)).toEqual([{ code: 'INVALID_DATE', field: 'date' }]);
  });

  it('accepts a real leap-day date', () => {
    expect(validateActivityDate('2028-02-29', { startDate: '2028-01-01', endDate: '2028-12-31' })).toEqual([]);
  });

  it('rejects a fake leap-day date in a non-leap year', () => {
    expect(validateActivityDate('2026-02-29', RANGE)).toEqual([{ code: 'INVALID_DATE', field: 'date' }]);
  });

  it('does not double-report an invalid date as also out of range', () => {
    const errors = validateActivityDate('2026-02-30', RANGE);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.code).toBe('INVALID_DATE');
  });

  it('handles a single-day trip range', () => {
    const oneDay = { startDate: '2026-09-05', endDate: '2026-09-05' };
    expect(validateActivityDate('2026-09-05', oneDay)).toEqual([]);
    expect(validateActivityDate('2026-09-06', oneDay)).toHaveLength(1);
  });
});
