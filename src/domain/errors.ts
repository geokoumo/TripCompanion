/**
 * Machine-readable validation errors for the domain layer.
 *
 * Every domain function returns `DomainError[]` instead of throwing or
 * returning presentation strings — callers (a React form, Trip Health, a
 * future AI agent) decide how/whether to render each `code`. Nothing in
 * this file or anywhere else under src/domain should contain user-facing
 * copy.
 */

export type DomainErrorCode =
  | 'MISSING_REQUIRED_DATA'
  | 'INVALID_DATE'
  | 'DATE_OUT_OF_RANGE'
  | 'INVALID_TIME_RANGE'
  | 'INVALID_DURATION'
  | 'TIME_OVERLAP'
  | 'STAY_OVERLAP'
  | 'INVALID_PRICE'
  | 'INVALID_CURRENCY'
  | 'INVALID_LOCATION';

interface DomainErrorBase<Code extends DomainErrorCode> {
  code: Code;
  /** Machine key of the offending field (e.g. "date", "durationMinutes") — never a presentation label. */
  field: string;
  /** Set by trip-level aggregation (validateTrip) to say which entity this error belongs to. Absent when a validator is called directly against a single entity, since the caller already knows which one it passed in. */
  entityId?: string;
}

export interface MissingRequiredDataError extends DomainErrorBase<'MISSING_REQUIRED_DATA'> {}
export interface InvalidDateError extends DomainErrorBase<'INVALID_DATE'> {}
export interface DateOutOfRangeError extends DomainErrorBase<'DATE_OUT_OF_RANGE'> {
  date: string;
  rangeStart: string;
  rangeEnd: string;
}
export interface InvalidTimeRangeError extends DomainErrorBase<'INVALID_TIME_RANGE'> {}
export interface InvalidDurationError extends DomainErrorBase<'INVALID_DURATION'> {}
export interface TimeOverlapError extends DomainErrorBase<'TIME_OVERLAP'> {
  /** id of the other activity this one conflicts with. */
  conflictingId: string;
}
export interface StayOverlapError extends DomainErrorBase<'STAY_OVERLAP'> {
  /** id of the other stay this one conflicts with. */
  conflictingId: string;
}
export interface InvalidPriceError extends DomainErrorBase<'INVALID_PRICE'> {}
export interface InvalidCurrencyError extends DomainErrorBase<'INVALID_CURRENCY'> {}
export interface InvalidLocationError extends DomainErrorBase<'INVALID_LOCATION'> {}

export type DomainError =
  | MissingRequiredDataError
  | InvalidDateError
  | DateOutOfRangeError
  | InvalidTimeRangeError
  | InvalidDurationError
  | TimeOverlapError
  | StayOverlapError
  | InvalidPriceError
  | InvalidCurrencyError
  | InvalidLocationError;

/** Stamps `entityId` onto every error — used when aggregating per-entity checks at the trip level. */
export function withEntityId(errors: DomainError[], entityId: string): DomainError[] {
  return errors.map((e) => ({ ...e, entityId }));
}
