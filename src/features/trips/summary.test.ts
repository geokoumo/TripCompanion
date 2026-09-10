import { describe, expect, it, vi } from 'vitest';
import { destinationLabel, statusStampLabel } from './lib/summary';

describe('destinationLabel', () => {
  it('shows a placeholder when there are no cities', () => {
    expect(destinationLabel([])).toBe('No cities');
  });

  it('shows the single city name as-is', () => {
    expect(destinationLabel(['Rome'])).toBe('Rome');
  });

  it('joins multiple cities with an arrow', () => {
    expect(destinationLabel(['Rome', 'Florence', 'Venice'])).toBe('Rome → Florence → Venice');
  });
});

describe('statusStampLabel', () => {
  it('shows "Archived" regardless of dates when the trip is archived', () => {
    expect(statusStampLabel({ archived: true, range: { startDate: '2020-01-01', endDate: '2020-01-05' } })).toBe('Archived');
  });

  it('falls through to "Completed" when there is no date range at all (an edge case, not a real trip)', () => {
    expect(statusStampLabel({ archived: false, range: null })).toBe('Completed');
  });

  it('counts down the days until a future trip starts', () => {
    vi.setSystemTime(new Date('2026-09-05T00:00:00Z'));
    expect(statusStampLabel({ archived: false, range: { startDate: '2026-09-10', endDate: '2026-09-15' } })).toBe('5 days away');
    vi.useRealTimers();
  });

  it('uses singular phrasing for exactly 1 day away', () => {
    vi.setSystemTime(new Date('2026-09-09T00:00:00Z'));
    expect(statusStampLabel({ archived: false, range: { startDate: '2026-09-10', endDate: '2026-09-15' } })).toBe('1 day away');
    vi.useRealTimers();
  });

  it('shows "Today" on the trip\'s start date', () => {
    vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
    expect(statusStampLabel({ archived: false, range: { startDate: '2026-09-10', endDate: '2026-09-15' } })).toBe('Today');
    vi.useRealTimers();
  });

  it('shows "In progress" partway through the trip', () => {
    vi.setSystemTime(new Date('2026-09-12T12:00:00Z'));
    expect(statusStampLabel({ archived: false, range: { startDate: '2026-09-10', endDate: '2026-09-15' } })).toBe('In progress');
    vi.useRealTimers();
  });

  it('shows "Completed" after the trip has ended', () => {
    vi.setSystemTime(new Date('2026-09-20T12:00:00Z'));
    expect(statusStampLabel({ archived: false, range: { startDate: '2026-09-10', endDate: '2026-09-15' } })).toBe('Completed');
    vi.useRealTimers();
  });
});
