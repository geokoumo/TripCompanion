import { buildAutoPulledEntries } from '../../itinerary/lib/autoPulledEntries';
import type { ItineraryStop } from '../../itinerary/types';
import type { Flight } from '../../flights/types';
import type { Stay } from '../../stays/types';

export interface TimelineMoment {
  id: string;
  date: string;
  time: string;
  title: string;
  subtitle?: string;
}

/**
 * Every discrete, timed moment on the trip — a flight's departure/arrival,
 * a stay's check-in/check-out (via the existing buildAutoPulledEntries),
 * plus every itinerary stop that has a specific time (all-day stops have no
 * single moment to report). Sorted chronologically.
 */
export function buildTripMoments(flights: Flight[], stays: Stay[], stops: ItineraryStop[]): TimelineMoment[] {
  const autoPulled = buildAutoPulledEntries(flights, stays).map(
    (entry): TimelineMoment => ({ id: entry.id, date: entry.date, time: entry.time, title: entry.title }),
  );

  const stopMoments = stops
    .filter((s): s is ItineraryStop & { time: string } => !s.allDay && !!s.time)
    .map(
      (s): TimelineMoment => ({
        id: `stop-${s.id}`,
        date: s.date,
        time: s.time,
        title: s.title,
        subtitle: s.location ?? undefined,
      }),
    );

  return [...autoPulled, ...stopMoments].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export interface CurrentAndNextMoment {
  current: TimelineMoment | null;
  next: TimelineMoment | null;
}

/**
 * From a chronologically-sorted moment list, picks the most recent moment
 * at or before `nowDate`/`nowTime` ("current") and the first one strictly
 * after it ("next"). Either can be null (a trip with nothing timed yet, or
 * one that's entirely in the past/future relative to `now`).
 */
export function getCurrentAndNextMoment(moments: TimelineMoment[], nowDate: string, nowTime: string): CurrentAndNextMoment {
  const nowKey = nowDate + nowTime;
  let current: TimelineMoment | null = null;
  let next: TimelineMoment | null = null;

  for (const moment of moments) {
    const key = moment.date + moment.time;
    if (key <= nowKey) {
      current = moment;
    } else if (next === null) {
      next = moment;
    }
  }

  return { current, next };
}

function minutesBetween(dateA: string, timeA: string, dateB: string, timeB: string): number {
  const msA = Date.parse(`${dateA}T${timeA}:00Z`);
  const msB = Date.parse(`${dateB}T${timeB}:00Z`);
  return Math.round((msB - msA) / 60000);
}

/** Minutes from `nowDate`/`nowTime` to the moment (negative if the moment is in the past). */
export function minutesUntilMoment(moment: TimelineMoment, nowDate: string, nowTime: string): number {
  return minutesBetween(nowDate, nowTime, moment.date, moment.time);
}

/** Humanizes an absolute minute count as "N min" / "Nh" / "Nd" — used for both an elapsed ("current") and a remaining ("next") duration, so it never sign-prefixes. */
export function formatRelativeMinutes(minutes: number): string {
  const abs = Math.round(Math.abs(minutes));
  if (abs < 60) return `${abs} min`;
  const hours = Math.round(abs / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}
