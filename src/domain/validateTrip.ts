import type { DomainError } from './errors';
import { withEntityId } from './errors';
import type { Trip } from './schemas';
import { isValidDateString } from './lib/dateTime';
import { validateRequiredData } from './validateRequiredData';
import { validateActivity } from './validateActivity';
import { detectStayOverlap } from './detectStayOverlap';

/**
 * Whole-trip validation: the trip's own required fields and date validity,
 * then validateActivity for every activity (checked against the trip's
 * date range and every other activity) and detectStayOverlap for every
 * stay (checked against every other stay), each error tagged with the
 * entity it belongs to via `entityId`.
 *
 * This is what Trip Health runs to audit already-saved data, and what a
 * save-time guard should run against the candidate trip immediately before
 * persisting it — always against freshly-loaded data, never a stale
 * frontend copy (see validateActivity's doc comment).
 */
export function validateTrip(trip: Trip): DomainError[] {
  const errors: DomainError[] = [...validateRequiredData('trip', trip)];

  const startValid = isValidDateString(trip.startDate);
  const endValid = isValidDateString(trip.endDate);
  if (trip.startDate && !startValid) errors.push({ code: 'INVALID_DATE', field: 'startDate' });
  if (trip.endDate && !endValid) errors.push({ code: 'INVALID_DATE', field: 'endDate' });

  const tripRange = startValid && endValid ? { startDate: trip.startDate, endDate: trip.endDate } : null;

  for (const activity of trip.activities) {
    const activityErrors = validateActivity(activity, { tripRange, existingActivities: trip.activities });
    errors.push(...withEntityId(activityErrors, activity.id));
  }

  for (const stay of trip.stays) {
    const stayErrors = detectStayOverlap(stay, trip.stays);
    errors.push(...withEntityId(stayErrors, stay.id));
  }

  return errors;
}
