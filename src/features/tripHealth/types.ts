import type { TripTab } from '../trips/types';

/**
 * Every distinct, deterministic issue Trip Health can find. Each maps to
 * exactly one rule in lib/computeTripHealth.ts and one entry in
 * lib/copy.ts — adding a new check means adding a new value here, not
 * reusing an existing one with different copy.
 */
export type TripHealthCheckType =
  | 'MISSING_REQUIRED_TRIP_INFO'
  | 'MISSING_REQUIRED_ACTIVITY_INFO'
  | 'ACTIVITY_DATE_OUT_OF_RANGE'
  | 'ACTIVITY_INVALID_TIME'
  | 'ACTIVITY_INVALID_DURATION'
  | 'ACTIVITY_INVALID_PRICE'
  | 'ACTIVITY_INVALID_LOCATION'
  | 'ACTIVITY_CONFLICT'
  | 'STAY_OVERLAP'
  | 'MISSING_BOARDING_PASS'
  | 'MISSING_STAY_DOCUMENT'
  | 'MISSING_EXCHANGE_RATE';

/**
 * critical: the trip itself is incomplete (no title/dates/travelers) —
 * nothing else can be meaningfully checked until this is fixed.
 * warning: a real, fixable data problem on otherwise-usable trip data.
 */
export type TripHealthSeverity = 'critical' | 'warning';

export type TripHealthEntityType = 'trip' | 'activity' | 'stay' | 'flight';

/** Where a warning's fix action should navigate — always a real, existing screen, never a dead end. */
export type TripHealthNavigationTarget = Extract<TripTab, 'budget' | 'flights' | 'stays' | 'itinerary'>;

/**
 * A single deterministic finding. `titleKey`/`descriptionKey`/`action` are
 * lookup keys into lib/copy.ts, never literal English — the actual
 * sentences (clear language, no jargon) live in exactly one place. `params`
 * carries whatever's needed to fill in a key's `{{placeholders}}` (a name,
 * a date, a count) — plain data, not presentation text.
 */
export interface TripHealthWarning {
  type: TripHealthCheckType;
  severity: TripHealthSeverity;
  entityType: TripHealthEntityType;
  entityId: string;
  titleKey: string;
  descriptionKey: string;
  params: Record<string, string>;
  action: string;
  navigationTarget: TripHealthNavigationTarget;
}

export interface TripHealthPassedCheck {
  /** One of the check "categories" in computeTripHealth.ts — a category is reported passed once every rule under it produced zero warnings. */
  id: string;
  labelKey: string;
}

export interface TripHealthReport {
  warnings: TripHealthWarning[];
  passedChecks: TripHealthPassedCheck[];
}
