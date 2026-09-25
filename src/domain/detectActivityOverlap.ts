import type { DomainError } from './errors';
import type { Activity } from './schemas';
import { rangesOverlap, toComparableMs } from './lib/dateTime';

interface TimeSpan {
  /** Absolute instant in ms (see toComparableMs) — comparable across different calendar dates, not just within one day. */
  start: number;
  end: number;
  /** True when this activity has a time but no duration — a specific moment rather than a span. See activitySpan(). */
  isPoint: boolean;
}

/**
 * The absolute-time span an activity occupies, or null when it doesn't
 * participate in overlap checking at all (all-day, or missing/invalid
 * date/time). Expressed via toComparableMs rather than minutes-since-midnight
 * so a span that runs past midnight (e.g. 23:30 + 90min) is comparable
 * against an activity on the *next* calendar date, not just ones sharing the
 * same date field.
 *
 * Duration stays optional by product design (StopForm labels it "DURATION
 * (OPTIONAL)") — plenty of real activities are a specific moment, not a
 * span: "boarding starts", "call the hotel", "fireworks". A durationless
 * timed activity is therefore modeled as a point in time, not skipped —
 * skipping it would silently make it immune to conflict detection, which
 * is the bug this fixes. No duration is ever invented on its behalf.
 */
function activitySpan(activity: Pick<Activity, 'allDay' | 'date' | 'time' | 'durationMinutes'>): TimeSpan | null {
  if (activity.allDay) return null;
  if (!activity.time) return null;

  const start = toComparableMs(activity.date, activity.time);
  if (Number.isNaN(start)) return null;

  const hasDuration = activity.durationMinutes != null && activity.durationMinutes > 0;
  return hasDuration ? { start, end: start + activity.durationMinutes! * 60_000, isPoint: false } : { start, end: start, isPoint: true };
}

/**
 * Whether two spans conflict, with a point-in-time span (isPoint) handled
 * separately from a proper [start, end) range: a zero-width interval can't
 * be run through the same half-open overlap formula (it would never
 * intersect anything, including another point at the exact same instant).
 * A point conflicts with a range iff it falls inside it (the same
 * start-inclusive/end-exclusive rule as ranges, so a point exactly at a
 * range's end is not a conflict, matching the "back-to-back is fine" rule
 * elsewhere); two points conflict iff they're the same instant.
 */
function spansConflict(a: TimeSpan, b: TimeSpan): boolean {
  if (!a.isPoint && !b.isPoint) return rangesOverlap(a.start, a.end, b.start, b.end);
  if (a.isPoint && b.isPoint) return a.start === b.start;
  const point = a.isPoint ? a : b;
  const span = a.isPoint ? b : a;
  return point.start >= span.start && point.start < span.end;
}

/**
 * Finds every activity in `existingActivities` that time-conflicts with
 * `candidate`, using real chronological instants rather than same-date
 * matching — a span that crosses midnight (e.g. 23:30 + 90min, ending 01:00
 * the next day) correctly conflicts with an activity starting at 00:30 on
 * that next calendar date.
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
 * - A timed activity with no duration is a point in time: it conflicts with
 *   another activity's span if it falls inside it, and with another
 *   durationless activity if they share the exact same time.
 */
export function detectActivityOverlap(candidate: Activity, existingActivities: Activity[]): DomainError[] {
  const candidateSpan = activitySpan(candidate);
  if (!candidateSpan) return [];

  const errors: DomainError[] = [];
  for (const other of existingActivities) {
    if (other.id === candidate.id) continue;

    const otherSpan = activitySpan(other);
    if (!otherSpan) continue;

    if (spansConflict(candidateSpan, otherSpan)) {
      errors.push({ code: 'TIME_OVERLAP', field: 'time', conflictingId: other.id });
    }
  }
  return errors;
}
