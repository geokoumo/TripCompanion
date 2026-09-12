import type { Flight } from '../../flights/types';
import type { Stay } from '../../stays/types';
import { buildAutoPulledEntries } from './autoPulledEntries';
import type { AutoPulledEntry, ItineraryStop } from '../types';

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export type TodayItemStatus = 'completed' | 'current' | 'upcoming';

export type TodayItemData = { kind: 'stop'; stop: ItineraryStop } | { kind: 'auto'; entry: AutoPulledEntry };

export interface TodayItem {
  id: string;
  status: TodayItemStatus;
  startMin: number;
  /** Equal to startMin for a point event with no duration (a flight/stay moment, or an untimed-duration stop). */
  endMin: number;
  data: TodayItemData;
}

export interface TodayReport {
  /** All-day stops never have a time slot, so they sit outside the completed/current/later timeline entirely — always shown, regardless of the current time. */
  allDayStops: ItineraryStop[];
  completed: TodayItem[];
  /** The one item to draw attention to: whatever's happening right now, or — if nothing is — the very next thing today. Null once the day (its timed portion) is over, or if nothing timed is scheduled at all. */
  highlight: TodayItem | null;
  highlightStatus: 'current' | 'upNext' | null;
  /** Every remaining upcoming item after the highlighted one. */
  later: TodayItem[];
}

/**
 * Today is never its own stored data — this is a pure projection of the
 * same itinerary stops (plus the flights/stays already merged into
 * auto-pulled entries elsewhere) for one specific calendar day, split into
 * what's already happened, what to look at right now, and what's still
 * ahead. Calling this with a different `nowTime` against the same inputs is
 * the only thing that ever changes the result — there is nothing else to
 * keep in sync.
 */
export function computeToday(params: { date: string; stops: ItineraryStop[]; flights: Flight[]; stays: Stay[]; nowTime: string }): TodayReport {
  const { date, stops, flights, stays, nowTime } = params;
  const nowMin = toMinutes(nowTime);

  const allDayStops = stops.filter((s) => s.date === date && s.allDay);

  const timedItems: Omit<TodayItem, 'status'>[] = stops
    .filter((s) => s.date === date && !s.allDay && s.time)
    .map((s) => {
      const start = toMinutes(s.time!);
      const end = s.durationMinutes ? start + s.durationMinutes : start;
      return { id: `stop-${s.id}`, startMin: start, endMin: end, data: { kind: 'stop', stop: s } };
    });

  const autoItems: Omit<TodayItem, 'status'>[] = buildAutoPulledEntries(flights, stays)
    .filter((e) => e.date === date)
    .map((e) => {
      const start = toMinutes(e.time);
      return { id: e.id, startMin: start, endMin: start, data: { kind: 'auto', entry: e } };
    });

  const merged = [...timedItems, ...autoItems].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const items: TodayItem[] = merged.map((item) => {
    const hasDuration = item.endMin > item.startMin;
    let status: TodayItemStatus;
    if (hasDuration) {
      status = nowMin >= item.endMin ? 'completed' : nowMin >= item.startMin ? 'current' : 'upcoming';
    } else {
      status = nowMin >= item.startMin ? 'completed' : 'upcoming';
    }
    return { ...item, status };
  });

  const completed = items.filter((i) => i.status === 'completed');
  const current = items.find((i) => i.status === 'current') ?? null;
  const upcoming = items.filter((i) => i.status === 'upcoming');

  const highlight = current ?? upcoming[0] ?? null;
  const highlightStatus: TodayReport['highlightStatus'] = current ? 'current' : upcoming[0] ? 'upNext' : null;
  const later = current ? upcoming : upcoming.slice(1);

  return { allDayStops, completed, highlight, highlightStatus, later };
}
