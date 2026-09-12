import type { DomainError } from './errors';
import type { Activity } from './schemas';
import { rangesOverlap } from './lib/dateTime';

interface TimeSpan {
  start: number;
  end: number;
}

/** The [start, end) minute-of-day span an activity occupies, or null when it doesn't occupy a specific span (all-day, or missing/invalid time+duration). */
function activitySpan(activity: Pick<Activity, 'allDay' | 'time' | 'durationMinutes'>): TimeSpan | null {
  if (activity.allDay) return null;
  if (!activity.time || activity.durationMinutes == null || activity.durationMinutes <= 0) return null;

  const [hours, minutes] = activity.time.split(':').map(Number);
  if (hours === undefined || minutes === undefined || Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const start = hours * 60 + minutes;
  return { start, end: start + activity.durationMinutes };
}

/**
 * Finds every activity in `existingActivities` that time-conflicts with
 * `candidate` on the same calendar date.
 *
 * - `candidate` is always excluded from the comparison by id, so passing
 *   the full current activity list (including the one being edited) is
 *   safe and is in fact the intended usage — this is what makes editing an
 *   activity not conflict against its own pre-edit self.
 * - All-day activities (on either side) never participate — they don't
 *   occupy a specific time span.
 * - Two spans that only touch at a shared boundary (one ends exactly when
 *   the other starts, e.g. 15:00–17:00 and 17:00–18:00) are NOT a conflict.
 * - Identical or partially-overlapping spans ARE a conflict.
 */
export function detectActivityOverlap(candidate: Activity, existingActivities: Activity[]): DomainError[] {
  const candidateSpan = activitySpan(candidate);
  if (!candidateSpan) return [];

  const errors: DomainError[] = [];
  for (const other of existingActivities) {
    if (other.id === candidate.id) continue;
    if (other.date !== candidate.date) continue;

    const otherSpan = activitySpan(other);
    if (!otherSpan) continue;

    if (rangesOverlap(candidateSpan.start, candidateSpan.end, otherSpan.start, otherSpan.end)) {
      errors.push({ code: 'TIME_OVERLAP', field: 'time', conflictingId: other.id });
    }
  }
  return errors;
}
