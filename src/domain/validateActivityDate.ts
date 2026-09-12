import type { DomainError } from './errors';
import type { DateRange } from './schemas';
import { isValidDateString } from './lib/dateTime';

/**
 * Validates one activity date: it must be a real calendar date, and — when
 * `tripRange` is known — inside the trip's [startDate, endDate] boundary
 * (inclusive on both ends: an activity on the trip's first or last day is
 * valid).
 *
 * `tripRange` is nullable because a trip's range may not be resolvable yet
 * (e.g. no dates set) — in that case range membership is skipped rather
 * than every activity failing closed.
 *
 * A UI date picker should call this (or just compare against tripRange
 * directly) to decide which calendar dates to disable, per the "dates
 * outside the trip boundary must be disabled" product rule — that's a
 * rendering decision for the caller, not something this function does.
 */
export function validateActivityDate(date: string, tripRange: DateRange | null): DomainError[] {
  if (!isValidDateString(date)) {
    return [{ code: 'INVALID_DATE', field: 'date' }];
  }

  if (tripRange && (date < tripRange.startDate || date > tripRange.endDate)) {
    return [
      {
        code: 'DATE_OUT_OF_RANGE',
        field: 'date',
        date,
        rangeStart: tripRange.startDate,
        rangeEnd: tripRange.endDate,
      },
    ];
  }

  return [];
}
