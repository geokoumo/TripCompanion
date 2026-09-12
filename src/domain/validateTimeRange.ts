import type { DomainError } from './errors';
import { MAX_DURATION_MINUTES, isValidTimeString } from './lib/dateTime';

export interface TimeRangeInput {
  allDay: boolean;
  time?: string | null;
  durationMinutes?: number | null;
}

/**
 * Validates an activity's time-of-day shape: a well-formed "HH:mm" time
 * (required unless all-day) and, when a duration is given, a positive whole
 * number of minutes under a generous sanity cap. An all-day activity has no
 * time range to validate at all, so every check is skipped for it.
 */
export function validateTimeRange({ allDay, time, durationMinutes }: TimeRangeInput): DomainError[] {
  if (allDay) return [];

  const errors: DomainError[] = [];

  if (!time || !isValidTimeString(time)) {
    errors.push({ code: 'INVALID_TIME_RANGE', field: 'time' });
  }

  if (durationMinutes !== undefined && durationMinutes !== null) {
    const isValidDuration = Number.isInteger(durationMinutes) && durationMinutes > 0 && durationMinutes <= MAX_DURATION_MINUTES;
    if (!isValidDuration) {
      errors.push({ code: 'INVALID_DURATION', field: 'durationMinutes' });
    }
  }

  return errors;
}
