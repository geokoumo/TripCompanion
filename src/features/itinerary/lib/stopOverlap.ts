import { rangesOverlap, toComparableMs } from '../../stays/lib/overlap';
import type { ItineraryStop } from '../types';

/**
 * Computes which stops in a single day's list have overlapping time ranges.
 * All-day stops never participate, on either side of a comparison — an
 * all-day stop occupies a distinct visual group (the "ΌΛΗ ΜΕΡΑ" heading),
 * not a specific time range, so it can never conflict with a timed stop.
 * A stop with no duration set also can't occupy a range, so it's excluded too.
 */
export function computeOverlappingStopIds(stopsForDay: ItineraryStop[]): Set<string> {
  const overlapIds = new Set<string>();
  const timed = stopsForDay.filter((s): s is ItineraryStop & { time: string; durationMinutes: number } => !s.allDay && Boolean(s.time) && Boolean(s.durationMinutes));

  for (let i = 0; i < timed.length; i++) {
    const a = timed[i]!;
    const aStart = toComparableMs(a.date, a.time);
    const aEnd = aStart + a.durationMinutes * 60_000;
    for (let j = i + 1; j < timed.length; j++) {
      const b = timed[j]!;
      const bStart = toComparableMs(b.date, b.time);
      const bEnd = bStart + b.durationMinutes * 60_000;
      if (rangesOverlap(aStart, aEnd, bStart, bEnd)) {
        overlapIds.add(a.id);
        overlapIds.add(b.id);
      }
    }
  }

  return overlapIds;
}
