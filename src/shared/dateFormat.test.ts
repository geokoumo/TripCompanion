import { describe, expect, it } from 'vitest';
import { dayNumber, daysBetween, formatDateNoYear, formatDateShort, weekdayShort } from './lib/dateFormat';

describe('formatDateShort', () => {
  it('formats an ISO date as "D Mon YYYY"', () => {
    expect(formatDateShort('2026-09-05')).toBe('5 Sep 2026');
  });

  it('returns the raw string unchanged when it cannot be parsed', () => {
    expect(formatDateShort('not-a-date')).toBe('not-a-date');
  });
});

describe('formatDateNoYear', () => {
  it('formats an ISO date as "D Mon" without the year', () => {
    expect(formatDateNoYear('2026-09-05')).toBe('5 Sep');
  });

  it('returns the raw string unchanged when it cannot be parsed', () => {
    expect(formatDateNoYear('nope')).toBe('nope');
  });
});

describe('weekdayShort', () => {
  it('returns the correct two-letter weekday for a known date', () => {
    // 2026-09-05 is a Saturday.
    expect(weekdayShort('2026-09-05')).toBe('Sa');
  });
});

describe('dayNumber', () => {
  it('extracts the day-of-month from an ISO date', () => {
    expect(dayNumber('2026-09-05')).toBe(5);
  });
});

describe('daysBetween', () => {
  it('counts whole days between two ISO dates', () => {
    expect(daysBetween('2026-09-05', '2026-09-10')).toBe(5);
  });

  it('returns a negative count when the "to" date is earlier', () => {
    expect(daysBetween('2026-09-10', '2026-09-05')).toBe(-5);
  });

  it('returns 0 for the same date', () => {
    expect(daysBetween('2026-09-05', '2026-09-05')).toBe(0);
  });
});
