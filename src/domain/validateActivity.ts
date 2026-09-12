import type { DomainError } from './errors';
import type { Activity, DateRange } from './schemas';
import { validateRequiredData } from './validateRequiredData';
import { validateActivityDate } from './validateActivityDate';
import { validateTimeRange } from './validateTimeRange';
import { validatePriceAndCurrency } from './validatePriceAndCurrency';
import { validateLocation } from './validateLocation';
import { detectActivityOverlap } from './detectActivityOverlap';

export interface ActivityValidationContext {
  /** The trip's overall date range, or null when it can't be determined yet (e.g. a brand-new trip with no dates set) — DATE_OUT_OF_RANGE is skipped in that case rather than every activity failing closed. */
  tripRange: DateRange | null;
  /**
   * Every other activity currently on the trip. Safe (and intended) to pass
   * the full list including `activity` itself when editing — overlap
   * detection excludes it by id internally.
   */
  existingActivities: Activity[];
}

/**
 * Full validation for one activity: required fields, date validity + trip
 * range membership, time/duration validity, price/currency consistency,
 * location (if provided), and time overlap against every other activity on
 * the same day. Returns every violation found at once rather than stopping
 * at the first one, so a caller can surface them all together.
 *
 * This is pure — it only looks at the data passed in. At save time the
 * caller must build `context.existingActivities` from the just-loaded
 * persisted trip (not cached component state), and re-run this
 * immediately before writing, so a conflict introduced by someone/something
 * else since the screen was opened is still caught. See validateTrip for
 * the whole-trip equivalent used by Trip Health.
 */
export function validateActivity(activity: Activity, context: ActivityValidationContext): DomainError[] {
  return [
    ...validateRequiredData('activity', activity),
    ...validateActivityDate(activity.date, context.tripRange),
    ...validateTimeRange({ allDay: activity.allDay, time: activity.time, durationMinutes: activity.durationMinutes }),
    ...validatePriceAndCurrency({ price: activity.price, currency: activity.currency }),
    ...validateLocation(activity.location),
    ...detectActivityOverlap(activity, context.existingActivities),
  ];
}
