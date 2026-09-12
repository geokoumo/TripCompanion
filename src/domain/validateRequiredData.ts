import type { DomainError } from './errors';

export type EntityKind = 'trip' | 'traveler' | 'activity' | 'flight' | 'stay' | 'booking' | 'document' | 'expense' | 'packingItem';

function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

const REQUIRED_FIELDS: Record<EntityKind, string[]> = {
  trip: ['id', 'title', 'startDate', 'endDate'],
  traveler: ['id', 'name'],
  activity: ['id', 'title', 'type', 'date'],
  flight: ['id', 'airline', 'flightNumber', 'depAirport', 'depDate', 'depTime', 'arrAirport', 'arrDate', 'arrTime'],
  stay: ['id', 'name', 'address', 'checkinDate', 'checkinTime', 'checkoutDate', 'checkoutTime'],
  booking: ['id', 'name', 'type'],
  document: ['id', 'title', 'category', 'fileType', 'storagePath'],
  expense: ['id', 'amount', 'currency', 'categoryId', 'date', 'paidBy', 'splitAmong'],
  packingItem: ['id', 'text', 'category', 'travelerId'],
};

/**
 * Generic required-field check, shared by every entity kind. `entity` is an
 * untyped bag on purpose — the calling validator (validateActivity, a
 * future validateFlight, ...) already knows the concrete type; this only
 * needs to know which keys must be non-blank for that kind.
 *
 * A field counts as present once it holds anything other than
 * undefined/null, an empty/whitespace-only string, or an empty array —
 * `0` and `false` are valid values, not missing data.
 */
export function validateRequiredData(kind: EntityKind, entity: Record<string, unknown>): DomainError[] {
  const errors: DomainError[] = [];
  for (const field of REQUIRED_FIELDS[kind]) {
    if (isBlank(entity[field])) {
      errors.push({ code: 'MISSING_REQUIRED_DATA', field });
    }
  }
  // An activity's time is conditionally required: mandatory unless it's
  // marked all-day, so it isn't in the flat REQUIRED_FIELDS list above.
  if (kind === 'activity' && !entity.allDay && isBlank(entity.time)) {
    errors.push({ code: 'MISSING_REQUIRED_DATA', field: 'time' });
  }
  return errors;
}
