import { describe, expect, it } from 'vitest';
import { computeDayProgress, legContextForDate } from './tripDayContext';

describe('computeDayProgress', () => {
  const days = ['2026-08-18', '2026-08-19', '2026-08-20'];

  it('reports 1-based position and total for a date in range', () => {
    expect(computeDayProgress(days, '2026-08-18')).toEqual({ dayNumber: 1, totalDays: 3 });
    expect(computeDayProgress(days, '2026-08-19')).toEqual({ dayNumber: 2, totalDays: 3 });
    expect(computeDayProgress(days, '2026-08-20')).toEqual({ dayNumber: 3, totalDays: 3 });
  });

  it('returns null for a date outside the trip range', () => {
    expect(computeDayProgress(days, '2026-09-01')).toBeNull();
  });

  it('returns null for an empty day range (no legs/flights yet)', () => {
    expect(computeDayProgress([], '2026-08-18')).toBeNull();
  });
});

describe('legContextForDate', () => {
  const leg = { startDate: '2026-08-25', endDate: '2026-08-30' };

  it('reports arrival on the leg\'s first day', () => {
    expect(legContextForDate(leg, '2026-08-25')).toBe('arrival');
  });

  it('reports departure on the leg\'s last day', () => {
    expect(legContextForDate(leg, '2026-08-30')).toBe('departure');
  });

  it('reports neither for a day in the middle of the leg', () => {
    expect(legContextForDate(leg, '2026-08-27')).toBeNull();
  });

  it('reports arrival (not departure) for a single-day leg', () => {
    const oneDayLeg = { startDate: '2026-08-25', endDate: '2026-08-25' };
    expect(legContextForDate(oneDayLeg, '2026-08-25')).toBe('arrival');
  });
});
