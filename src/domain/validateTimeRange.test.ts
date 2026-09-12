import { describe, expect, it } from 'vitest';
import { validateTimeRange } from './validateTimeRange';

describe('validateTimeRange', () => {
  it('accepts a well-formed time with a valid duration', () => {
    expect(validateTimeRange({ allDay: false, time: '15:00', durationMinutes: 90 })).toEqual([]);
  });

  it('accepts a well-formed time with no duration at all (untimed point event)', () => {
    expect(validateTimeRange({ allDay: false, time: '09:30' })).toEqual([]);
  });

  it('skips every check for an all-day activity, even with garbage time/duration', () => {
    expect(validateTimeRange({ allDay: true, time: 'nonsense', durationMinutes: -5 })).toEqual([]);
    expect(validateTimeRange({ allDay: true })).toEqual([]);
  });

  describe('time validity', () => {
    it('rejects a missing time when not all-day', () => {
      expect(validateTimeRange({ allDay: false })).toEqual([{ code: 'INVALID_TIME_RANGE', field: 'time' }]);
    });

    it('rejects an empty-string time', () => {
      expect(validateTimeRange({ allDay: false, time: '' })).toEqual([{ code: 'INVALID_TIME_RANGE', field: 'time' }]);
    });

    it('rejects hour 24', () => {
      expect(validateTimeRange({ allDay: false, time: '24:00' })).toEqual([{ code: 'INVALID_TIME_RANGE', field: 'time' }]);
    });

    it('rejects minute 60', () => {
      expect(validateTimeRange({ allDay: false, time: '10:60' })).toEqual([{ code: 'INVALID_TIME_RANGE', field: 'time' }]);
    });

    it('rejects a single-digit hour without a leading zero', () => {
      expect(validateTimeRange({ allDay: false, time: '9:30' })).toEqual([{ code: 'INVALID_TIME_RANGE', field: 'time' }]);
    });

    it('rejects a 12-hour-clock string', () => {
      expect(validateTimeRange({ allDay: false, time: '9:30 AM' })).toEqual([{ code: 'INVALID_TIME_RANGE', field: 'time' }]);
    });

    it('accepts midnight and one-minute-to-midnight boundaries', () => {
      expect(validateTimeRange({ allDay: false, time: '00:00' })).toEqual([]);
      expect(validateTimeRange({ allDay: false, time: '23:59' })).toEqual([]);
    });
  });

  describe('duration validity', () => {
    it('rejects a zero duration', () => {
      expect(validateTimeRange({ allDay: false, time: '10:00', durationMinutes: 0 })).toEqual([
        { code: 'INVALID_DURATION', field: 'durationMinutes' },
      ]);
    });

    it('rejects a negative duration', () => {
      expect(validateTimeRange({ allDay: false, time: '10:00', durationMinutes: -30 })).toEqual([
        { code: 'INVALID_DURATION', field: 'durationMinutes' },
      ]);
    });

    it('rejects a non-integer duration', () => {
      expect(validateTimeRange({ allDay: false, time: '10:00', durationMinutes: 30.5 })).toEqual([
        { code: 'INVALID_DURATION', field: 'durationMinutes' },
      ]);
    });

    it('rejects NaN', () => {
      expect(validateTimeRange({ allDay: false, time: '10:00', durationMinutes: NaN })).toEqual([
        { code: 'INVALID_DURATION', field: 'durationMinutes' },
      ]);
    });

    it('rejects Infinity', () => {
      expect(validateTimeRange({ allDay: false, time: '10:00', durationMinutes: Infinity })).toEqual([
        { code: 'INVALID_DURATION', field: 'durationMinutes' },
      ]);
    });

    it('rejects an absurdly large duration beyond the sanity cap', () => {
      expect(validateTimeRange({ allDay: false, time: '10:00', durationMinutes: 60 * 24 * 365 })).toEqual([
        { code: 'INVALID_DURATION', field: 'durationMinutes' },
      ]);
    });

    it('accepts a 1-minute duration', () => {
      expect(validateTimeRange({ allDay: false, time: '10:00', durationMinutes: 1 })).toEqual([]);
    });

    it('accepts null/undefined duration as "not tracked" rather than invalid', () => {
      expect(validateTimeRange({ allDay: false, time: '10:00', durationMinutes: null })).toEqual([]);
      expect(validateTimeRange({ allDay: false, time: '10:00', durationMinutes: undefined })).toEqual([]);
    });
  });

  it('reports both an invalid time and an invalid duration together', () => {
    const errors = validateTimeRange({ allDay: false, time: 'bad', durationMinutes: -1 });
    expect(errors).toHaveLength(2);
    expect(errors.map((e) => e.code).sort()).toEqual(['INVALID_DURATION', 'INVALID_TIME_RANGE']);
  });
});
