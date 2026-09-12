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

  it('ignores activities on a different date even at the same time', () => {
    const candidate = makeActivity({ id: 'a1', date: '2026-09-05', time: '15:00', durationMinutes: 120 });
    const other = makeActivity({ id: 'a2', date: '2026-09-06', time: '15:00', durationMinutes: 120 });
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

  it('an activity with no duration set never conflicts (matches product behavior: an undurated stop occupies nothing)', () => {
    const candidate = makeActivity({ id: 'a1', time: '15:00', durationMinutes: undefined });
    const other = makeActivity({ id: 'a2', time: '15:00', durationMinutes: 120 });
    expect(detectActivityOverlap(candidate, [other])).toEqual([]);
  });

  it('reports one TIME_OVERLAP error per conflicting activity', () => {
    const candidate = makeActivity({ id: 'a1', time: '15:00', durationMinutes: 120 }); // 15:00-17:00
    const other1 = makeActivity({ id: 'a2', time: '16:00', durationMinutes: 30 }); // overlaps
    const other2 = makeActivity({ id: 'a3', time: '20:00', durationMinutes: 30 }); // no overlap
    const other3 = makeActivity({ id: 'a4', time: '16:30', durationMinutes: 15 }); // overlaps
    const errors = detectActivityOverlap(candidate, [other1, other2, other3]);
    expect(errors.map((e) => (e.code === 'TIME_OVERLAP' ? e.conflictingId : null)).sort()).toEqual(['a2', 'a4']);
  });

  it('treats a negative duration as not occupying any span rather than crashing', () => {
    const candidate = makeActivity({ id: 'a1', time: '15:00', durationMinutes: 60 });
    const other = makeActivity({ id: 'a2', time: '15:00', durationMinutes: -60 });
    expect(detectActivityOverlap(candidate, [other])).toEqual([]);
  });

  it('handles a candidate that spans midnight-adjacent minutes correctly within the same day', () => {
    const candidate = makeActivity({ id: 'a1', time: '23:00', durationMinutes: 90 }); // 23:00-24:30 (clock overflow, still fine as raw minutes)
    const other = makeActivity({ id: 'a2', time: '23:59', durationMinutes: 10 });
    expect(detectActivityOverlap(candidate, [other])).toEqual([{ code: 'TIME_OVERLAP', field: 'time', conflictingId: 'a2' }]);
  });
});
