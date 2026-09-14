import { describe, expect, it } from 'vitest';
import { dayNumber, daysBetween, formatDateLong, formatDateNoYear, formatDateShort, weekdayFull, weekdayShort } from './lib/dateFormat';

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

describe('weekdayFull', () => {
  it('computes the full weekday name from the actual date, never a hardcoded value', () => {
    // 2026-09-05 is a Saturday (verified against weekdayShort above); 33
    // days later, 2026-10-08, is therefore a Thursday.
    expect(weekdayFull('2026-09-05')).toBe('Saturday');
    expect(weekdayFull('2026-10-08')).toBe('Thursday');
  });

  it('gives a different weekday for adjacent dates — proves it is computed, not constant', () => {
    expect(weekdayFull('2026-10-07')).not.toBe(weekdayFull('2026-10-08'));
  });
});

describe('formatDateLong', () => {
  it('formats as "Weekday · D Month" using the real computed weekday', () => {
    expect(formatDateLong('2026-10-08')).toBe('Thursday · 8 October');
  });

  it('returns the raw string unchanged when it cannot be parsed', () => {
    expect(formatDateLong('nope')).toBe('nope');
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
