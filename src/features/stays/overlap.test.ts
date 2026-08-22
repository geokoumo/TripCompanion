import { describe, expect, it } from 'vitest';
import { dateTimeRangesOverlap, rangesOverlap } from './lib/overlap';

describe('rangesOverlap', () => {
  it('does not warn when checkout day equals checkin day (adjacent, not overlapping)', () => {
    const stayA = {
      start: { date: '2026-09-05', time: '15:00' },
      end: { date: '2026-09-10', time: '11:00' },
    };
    const stayB = {
      start: { date: '2026-09-10', time: '11:00' },
      end: { date: '2026-09-14', time: '11:00' },
    };
    expect(dateTimeRangesOverlap(stayA, stayB)).toBe(false);
  });

  it('detects a genuine overlap', () => {
    const stayA = {
      start: { date: '2026-09-05', time: '15:00' },
      end: { date: '2026-09-10', time: '11:00' },
    };
    const stayB = {
      start: { date: '2026-09-08', time: '15:00' },
      end: { date: '2026-09-12', time: '11:00' },
    };
    expect(dateTimeRangesOverlap(stayA, stayB)).toBe(true);
  });

  it('detects a nested range as overlapping', () => {
    const outer = {
      start: { date: '2026-09-01', time: '00:00' },
      end: { date: '2026-09-20', time: '00:00' },
    };
    const inner = {
      start: { date: '2026-09-05', time: '10:00' },
      end: { date: '2026-09-06', time: '10:00' },
    };
    expect(dateTimeRangesOverlap(outer, inner)).toBe(true);
  });

  it('rangesOverlap works directly on millisecond values', () => {
    expect(rangesOverlap(0, 10, 10, 20)).toBe(false);
    expect(rangesOverlap(0, 10, 5, 20)).toBe(true);
  });
});
