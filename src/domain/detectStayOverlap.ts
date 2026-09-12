import type { DomainError } from './errors';
import type { Stay } from './schemas';
import { dateTimeRangesOverlap } from './lib/dateTime';

function stayRange(stay: Stay) {
  return {
    start: { date: stay.checkinDate, time: stay.checkinTime },
    end: { date: stay.checkoutDate, time: stay.checkoutTime },
  };
}

/**
 * Finds every stay in `existingStays` whose check-in/check-out span
 * overlaps `candidate`'s. `candidate` is always excluded from the
 * comparison by id, so editing a stay doesn't flag it against its own
 * pre-edit self.
 *
 * Unlike activities, stays are not checked against the trip's overall date
 * range here — accommodation legitimately brackets the itinerary rather
 * than sitting strictly inside it (a check-in the evening before day one,
 * a check-out the morning after the last day). Where a product rule wants
 * a stricter boundary for stays, that's a decision for the caller, not
 * this generic overlap check.
 */
export function detectStayOverlap(candidate: Stay, existingStays: Stay[]): DomainError[] {
  const candidateRange = stayRange(candidate);
  const errors: DomainError[] = [];

  for (const other of existingStays) {
    if (other.id === candidate.id) continue;
    if (dateTimeRangesOverlap(candidateRange, stayRange(other))) {
      errors.push({ code: 'STAY_OVERLAP', field: 'checkinDate', conflictingId: other.id });
    }
  }

  return errors;
}
