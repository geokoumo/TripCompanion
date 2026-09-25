import { describe, expect, it } from 'vitest';
import { detectActivityOverlap } from './detectActivityOverlap';
import type { Activity } from './schemas';

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'a1',
    title: 'Museum',
    type: 'sight',
    date: '2026-09-05',
    allDay: false,
    time: '15:00',
    durationMinutes: 120,
    travelerIds: [],
    done: false,
    ...overrides,
  };
}

describe('detectActivityOverlap', () => {
  it('is valid when one activity ends exactly when the next starts (15:00–17:00, 17:00–18:00)', () => {
    const candidate = makeActivity({ id: 'a1', time: '15:00', durationMinutes: 120 }); // 15:00-17:00
    const other = makeActivity({ id: 'a2', time: '17:00', durationMinutes: 60 }); // 17:00-18:00
    expect(detectActivityOverlap(candidate, [other])).toEqual([]);
  });

  it('is invalid when the second activity starts one minute before the first ends (15:00–17:00, 16:59–18:00)', () => {
    const candidate = makeActivity({ id: 'a1', time: '15:00', durationMinutes: 120 }); // 15:00-17:00
    const other = makeActivity({ id: 'a2', time: '16:59', durationMinutes: 61 }); // 16:59-18:00
    const errors = detectActivityOverlap(candidate, [other]);
    expect(errors).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'a2' }]);
  });

  it('is invalid for two identical time ranges (15:00–17:00, 15:00–17:00)', () => {
    const candidate = makeActivity({ id: 'a1', time: '15:00', durationMinutes: 120 });
    const other = makeActivity({ id: 'a2', time: '15:00', durationMinutes: 120 });
    const errors = detectActivityOverlap(candidate, [other]);
    expect(errors).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'a2' }]);
  });

  it('is valid when one span is fully before the other with a gap', () => {
    const candidate = makeActivity({ id: 'a1', time: '09:00', durationMinutes: 60 });
    const other = makeActivity({ id: 'a2', time: '15:00', durationMinutes: 60 });
    expect(detectActivityOverlap(candidate, [other])).toEqual([]);
  });

  it('flags a conflict when one span is fully contained inside another', () => {
    const candidate = makeActivity({ id: 'a1', time: '15:00', durationMinutes: 30 }); // 15:00-15:30
    const other = makeActivity({ id: 'a2', time: '14:00', durationMinutes: 180 }); // 14:00-17:00
    const errors = detectActivityOverlap(candidate, [other]);
    expect(errors).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'a2' }]);
  });

  it('does not conflict with an activity a full day away, even at the same clock time', () => {
    const candidate = makeActivity({ id: 'a1', date: '2026-09-05', time: '15:00', durationMinutes: 120 }); // ends 17:00 on the 5th
    const other = makeActivity({ id: 'a2', date: '2026-09-06', time: '15:00', durationMinutes: 120 }); // starts 15:00 on the 6th — no real overlap
    expect(detectActivityOverlap(candidate, [other])).toEqual([]);
  });

  it('never flags an all-day activity as conflicting, even at an overlapping time', () => {
    const candidate = makeActivity({ id: 'a1', time: '15:00', durationMinutes: 120 });
    const allDayOther = makeActivity({ id: 'a2', allDay: true, time: undefined, durationMinutes: undefined });
    expect(detectActivityOverlap(candidate, [allDayOther])).toEqual([]);
  });

  it('returns no errors when the candidate itself is all-day', () => {
    const candidate = makeActivity({ id: 'a1', allDay: true, time: undefined, durationMinutes: undefined });
    const other = makeActivity({ id: 'a2', time: '15:00', durationMinutes: 120 });
    expect(detectActivityOverlap(candidate, [other])).toEqual([]);
  });

  it('EDITING: excludes the activity itself from the comparison set by id', () => {
    const candidate = makeActivity({ id: 'a1', time: '15:00', durationMinutes: 120 });
    // The "existing" list includes the pre-edit version of the same activity (same id).
    const preEditSelf = makeActivity({ id: 'a1', time: '15:00', durationMinutes: 120 });
    expect(detectActivityOverlap(candidate, [preEditSelf])).toEqual([]);
  });

  // A durationless timed activity is a point in time, not skipped — see
  // activitySpan()'s docstring for why (this is the fix for the QA finding
  // that an undurated activity was never checked for overlap at all).
  describe('point-in-time activities (no duration set)', () => {
    it('flags a conflict when the point falls inside another activity\'s span', () => {
      const candidate = makeActivity({ id: 'a1', time: '15:00', durationMinutes: undefined }); // a moment at 15:00
      const other = makeActivity({ id: 'a2', time: '14:00', durationMinutes: 120 }); // 14:00-16:00
      const errors = detectActivityOverlap(candidate, [other]);
      expect(errors).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'a2' }]);
    });

    it('flags a conflict when the point lands exactly on another span\'s start', () => {
      const candidate = makeActivity({ id: 'a1', time: '15:00', durationMinutes: undefined });
      const other = makeActivity({ id: 'a2', time: '15:00', durationMinutes: 60 }); // 15:00-16:00
      const errors = detectActivityOverlap(candidate, [other]);
      expect(errors).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'a2' }]);
    });

    it('does not conflict when the point lands exactly on another span\'s end (back-to-back is fine)', () => {
      const candidate = makeActivity({ id: 'a1', time: '16:00', durationMinutes: undefined });
      const other = makeActivity({ id: 'a2', time: '15:00', durationMinutes: 60 }); // 15:00-16:00
      expect(detectActivityOverlap(candidate, [other])).toEqual([]);
    });

    it('does not conflict when the point falls outside another span entirely', () => {
      const candidate = makeActivity({ id: 'a1', time: '20:00', durationMinutes: undefined });
      const other = makeActivity({ id: 'a2', time: '15:00', durationMinutes: 60 });
      expect(detectActivityOverlap(candidate, [other])).toEqual([]);
    });

    it('flags a conflict between two durationless activities at the exact same instant', () => {
      const candidate = makeActivity({ id: 'a1', time: '15:00', durationMinutes: undefined });
      const other = makeActivity({ id: 'a2', time: '15:00', durationMinutes: undefined });
      const errors = detectActivityOverlap(candidate, [other]);
      expect(errors).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'a2' }]);
    });

    it('does not conflict between two durationless activities at different times', () => {
      const candidate = makeActivity({ id: 'a1', time: '15:00', durationMinutes: undefined });
      const other = makeActivity({ id: 'a2', time: '15:01', durationMinutes: undefined });
      expect(detectActivityOverlap(candidate, [other])).toEqual([]);
    });
  });

  it('reports one TIME_OVERLAP error per conflicting activity', () => {
    const candidate = makeActivity({ id: 'a1', time: '15:00', durationMinutes: 120 }); // 15:00-17:00
    const other1 = makeActivity({ id: 'a2', time: '16:00', durationMinutes: 30 }); // overlaps
    const other2 = makeActivity({ id: 'a3', time: '20:00', durationMinutes: 30 }); // no overlap
    const other3 = makeActivity({ id: 'a4', time: '16:30', durationMinutes: 15 }); // overlaps
    const errors = detectActivityOverlap(candidate, [other1, other2, other3]);
    expect(errors.map((e) => (e.code === 'TIME_OVERLAP' ? e.conflictingId : null)).sort()).toEqual(['a2', 'a4']);
  });

  it('treats an invalid (negative) duration as a point in time rather than crashing', () => {
    const candidate = makeActivity({ id: 'a1', time: '15:00', durationMinutes: 60 }); // 15:00-16:00
    const other = makeActivity({ id: 'a2', time: '15:00', durationMinutes: -60 }); // falls back to a point at 15:00, inside candidate's span
    const errors = detectActivityOverlap(candidate, [other]);
    expect(errors).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'a2' }]);
  });

  it('handles a candidate that spans midnight-adjacent minutes correctly within the same day', () => {
    const candidate = makeActivity({ id: 'a1', time: '23:00', durationMinutes: 90 }); // 23:00-00:30 the next day
    const other = makeActivity({ id: 'a2', time: '23:59', durationMinutes: 10 });
    expect(detectActivityOverlap(candidate, [other])).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'a2' }]);
  });

  describe('real cross-midnight chronology (activities on different calendar dates)', () => {
    it('flags a conflict when a span crossing midnight overlaps an activity starting after midnight the next day', () => {
      // 23:30 + 90min on the 5th ends 01:00 on the 6th — genuinely overlaps a 00:30 start on the 6th.
      const candidate = makeActivity({ id: 'a1', date: '2026-09-05', time: '23:30', durationMinutes: 90 });
      const other = makeActivity({ id: 'a2', date: '2026-09-06', time: '00:30', durationMinutes: 30 });
      const errors = detectActivityOverlap(candidate, [other]);
      expect(errors).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'a2' }]);
    });

    it('is symmetric: the next-day activity also reports the conflict when checked as the candidate', () => {
      const candidate = makeActivity({ id: 'a2', date: '2026-09-06', time: '00:30', durationMinutes: 30 });
      const other = makeActivity({ id: 'a1', date: '2026-09-05', time: '23:30', durationMinutes: 90 });
      const errors = detectActivityOverlap(candidate, [other]);
      expect(errors).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'a1' }]);
    });

    it('allows back-to-back activities across midnight: 23:00–24:00 on day 1 then 00:00–01:00 on day 2', () => {
      const candidate = makeActivity({ id: 'a1', date: '2026-09-05', time: '23:00', durationMinutes: 60 }); // ends exactly at midnight
      const other = makeActivity({ id: 'a2', date: '2026-09-06', time: '00:00', durationMinutes: 60 });
      expect(detectActivityOverlap(candidate, [other])).toEqual([]);
    });

    it('does not conflict when a span crossing midnight ends before the next-day activity starts', () => {
      const candidate = makeActivity({ id: 'a1', date: '2026-09-05', time: '23:30', durationMinutes: 30 }); // ends 00:00 on the 6th
      const other = makeActivity({ id: 'a2', date: '2026-09-06', time: '01:00', durationMinutes: 30 });
      expect(detectActivityOverlap(candidate, [other])).toEqual([]);
    });

    it('still ignores all-day activities on the adjacent date, even when a timed span crosses into it', () => {
      const candidate = makeActivity({ id: 'a1', date: '2026-09-05', time: '23:30', durationMinutes: 90 });
      const allDayOther = makeActivity({ id: 'a2', date: '2026-09-06', allDay: true, time: undefined, durationMinutes: undefined });
      expect(detectActivityOverlap(candidate, [allDayOther])).toEqual([]);
    });
  });
});
