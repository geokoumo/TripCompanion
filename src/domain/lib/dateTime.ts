/** Internal date/time primitives shared by the domain validators. Not exported from the package's public surface (see ../index.ts) — callers use the named validators instead. */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const MINUTES_PER_DAY = 24 * 60;

/** Generous upper bound on a single activity's duration — catches garbage input (e.g. minutes typed where hours were meant) without rejecting a legitimate multi-day booking. */
export const MAX_DURATION_MINUTES = MINUTES_PER_DAY * 30;

/** True for a syntactically well-formed AND calendrically real "YYYY-MM-DD" date (rejects e.g. 2026-02-30). */
export function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** True for a well-formed 24h "HH:mm" time string. */
export function isValidTimeString(value: string): boolean {
  return TIME_RE.test(value);
}

/** Minutes since midnight for a validated "HH:mm" string. Callers must check isValidTimeString first — this does not re-validate. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number) as [number, number];
  return h * 60 + m;
}

/**
 * Half-open interval overlap: [startA, endA) vs [startB, endB). Two ranges
 * that only touch at a shared boundary (one ends exactly when the other
 * starts) are NOT considered overlapping — this is what makes back-to-back
 * activities (15:00–17:00 then 17:00–18:00) valid.
 */
export function rangesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

/** Naive local date+time pair reduced to a comparable millisecond value (UTC-parsed; only relative ordering matters, no real timezone is applied). */
export function toComparableMs(date: string, time: string): number {
  return Date.parse(`${date}T${time}:00Z`);
}

export interface DateTimePoint {
  date: string;
  time: string;
}

export function dateTimeRangesOverlap(a: { start: DateTimePoint; end: DateTimePoint }, b: { start: DateTimePoint; end: DateTimePoint }): boolean {
  const startA = toComparableMs(a.start.date, a.start.time);
  const endA = toComparableMs(a.end.date, a.end.time);
  const startB = toComparableMs(b.start.date, b.start.time);
  const endB = toComparableMs(b.end.date, b.end.time);
  return rangesOverlap(startA, endA, startB, endB);
}
