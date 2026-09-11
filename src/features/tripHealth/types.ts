import type { TripTab } from '../trips/types';

/**
 * Only one severity exists today (everything computable is a "fix this"
 * warning, not yet a hard blocker or a purely informational note) — kept as
 * a field rather than hardcoding a single shape so a future critical/info
 * tier doesn't require touching every warning site.
 */
export type TripHealthSeverity = 'warning';

/** Where a warning's fix action should navigate — always a real, existing screen, never a dead end. */
export type TripHealthFixTarget = Extract<TripTab, 'budget' | 'flights' | 'stays' | 'itinerary'>;

export interface TripHealthWarning {
  id: string;
  severity: TripHealthSeverity;
  title: string;
  description: string;
  fixLabel: string;
  fixTarget: TripHealthFixTarget;
}

export interface TripHealthPassedCheck {
  id: string;
  label: string;
}

export interface TripHealthReport {
  warnings: TripHealthWarning[];
  passedChecks: TripHealthPassedCheck[];
}
