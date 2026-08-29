import type { Flight } from '../../flights/types';
import type { Stay } from '../../stays/types';
import type { ItineraryStop } from '../types';

/** A blocked minute-of-day window `[startMin, endMin)` for one specific calendar day. */
export interface OccupiedRange {
  startMin: number;
  endMin: number;
  label: string;
}

const DAY_MINUTES = 24 * 60;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function formatMinutes(min: number): string {
  const clamped = Math.max(0, Math.min(min, DAY_MINUTES));
  const h = Math.floor(clamped / 60) % 24;
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Human-readable "(HH:MM)" for a point event or "(HH:MM–HH:MM)" for a real span. */
export function formatRangeLabel(range: OccupiedRange): string {
  if (range.endMin - range.startMin <= 1) return `(${formatMinutes(range.startMin)})`;
  return `(${formatMinutes(range.startMin)}–${formatMinutes(range.endMin)})`;
}

interface ComputeOccupiedRangesParams {
  date: string;
  stops: ItineraryStop[];
  flights: Flight[];
  stays: Stay[];
  /** The stop currently being edited, excluded so it doesn't block itself. */
  excludeStopId?: string;
}

/**
 * Computes every occupied minute-of-day window for one calendar day, per the
 * Round 8 hard-block rules:
 *  - a manual timed stop with a duration occupies [time, time+duration)
 *  - a flight occupies its full elapsed span, clipped to this specific day
 *    (a flight departing 23:40 and arriving 06:15 the next day occupies
 *    [23:40, 24:00) on the departure day and [00:00, 06:15) on the arrival day)
 *  - a stay check-in/check-out occupies only its exact instant, not a range
 *  - an all-day stop never participates (it isn't a specific time range)
 */
export function computeOccupiedRanges({ date, stops, flights, stays, excludeStopId }: ComputeOccupiedRangesParams): OccupiedRange[] {
  const ranges: OccupiedRange[] = [];

  for (const stop of stops) {
    if (stop.id === excludeStopId) continue;
    if (stop.allDay) continue;
    if (stop.date !== date) continue;
    if (!stop.time || !stop.durationMinutes) continue;
    const start = toMinutes(stop.time);
    const end = Math.min(start + stop.durationMinutes, DAY_MINUTES);
    ranges.push({ startMin: start, endMin: end, label: stop.title });
  }

  for (const flight of flights) {
    const label = `${flight.airline} ${flight.flightNumber}`.trim();
    if (flight.depDate === date && flight.arrDate === date) {
      ranges.push({ startMin: toMinutes(flight.depTime), endMin: toMinutes(flight.arrTime), label });
    } else if (flight.depDate === date && flight.arrDate > date) {
      ranges.push({ startMin: toMinutes(flight.depTime), endMin: DAY_MINUTES, label });
    } else if (flight.arrDate === date && flight.depDate < date) {
      ranges.push({ startMin: 0, endMin: toMinutes(flight.arrTime), label });
    } else if (flight.depDate < date && flight.arrDate > date) {
      // A multi-day flight (very long layover modeled as one entry) occupies the whole day.
      ranges.push({ startMin: 0, endMin: DAY_MINUTES, label });
    }
  }

  for (const stay of stays) {
    if (stay.checkinDate === date) {
      const start = toMinutes(stay.checkinTime);
      ranges.push({ startMin: start, endMin: Math.min(start + 1, DAY_MINUTES), label: `Check-in — ${stay.name}` });
    }
    if (stay.checkoutDate === date) {
      const start = toMinutes(stay.checkoutTime);
      ranges.push({ startMin: start, endMin: Math.min(start + 1, DAY_MINUTES), label: `Check-out — ${stay.name}` });
    }
  }

  return ranges;
}

/** True when [startMin, startMin+durationMinutes) intersects the given range. */
function intersects(startMin: number, durationMinutes: number, range: OccupiedRange): boolean {
  const endMin = startMin + durationMinutes;
  return startMin < range.endMin && range.startMin < endMin;
}

/** The first occupied range (if any) that a candidate [start, start+duration) span conflicts with. */
export function findConflict(startMin: number, durationMinutes: number, ranges: OccupiedRange[]): OccupiedRange | undefined {
  return ranges.find((r) => intersects(startMin, durationMinutes, r));
}
