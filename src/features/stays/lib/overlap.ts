export interface DateTimeRange {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

/** Converts a naive local date+time pair into a comparable millisecond value (UTC-parsed, no real timezone applied — only relative ordering matters). */
export function toComparableMs(date: string, time: string): number {
  return Date.parse(`${date}T${time}:00Z`);
}

/**
 * Generic half-open range overlap detector: [startA, endA) vs [startB, endB).
 * Ranges that only touch at a boundary (e.g. one ends exactly when the other
 * starts) are NOT considered overlapping.
 */
export function rangesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

export function dateTimeRangesOverlap(a: { start: DateTimeRange; end: DateTimeRange }, b: { start: DateTimeRange; end: DateTimeRange }): boolean {
  const startA = toComparableMs(a.start.date, a.start.time);
  const endA = toComparableMs(a.end.date, a.end.time);
  const startB = toComparableMs(b.start.date, b.start.time);
  const endB = toComparableMs(b.end.date, b.end.time);
  return rangesOverlap(startA, endA, startB, endB);
}
