import { normalizeForMatch } from '../../../shared/lib/textNormalize';
import type { Trip } from '../../trips/types';
import type { SearchMatch } from '../types';

/**
 * Pure per-trip matcher backing LocalStorageTripRepository.searchTrips —
 * mirrors what search_trips() does server-side (flight number/airline, stay
 * name, stop title, expense note) so local-only and signed-in search behave
 * the same way, just against different data sources.
 */
export function searchWithinTrip(trip: Trip, query: string): SearchMatch[] {
  const needle = normalizeForMatch(query);
  if (!needle) return [];
  const matches: SearchMatch[] = [];

  for (const f of trip.flights) {
    if (normalizeForMatch(f.flightNumber).includes(needle) || normalizeForMatch(f.airline).includes(needle)) {
      matches.push({ type: 'flight', id: f.id, label: `${f.airline} ${f.flightNumber} · ${f.depAirport} → ${f.arrAirport}`, tab: 'flights' });
    }
  }

  for (const s of trip.stays) {
    if (normalizeForMatch(s.name).includes(needle)) {
      matches.push({ type: 'stay', id: s.id, label: s.name, tab: 'stays' });
    }
  }

  for (const stop of trip.itineraryStops) {
    if (normalizeForMatch(stop.title).includes(needle)) {
      matches.push({ type: 'stop', id: stop.id, label: stop.title, tab: 'itinerary' });
    }
  }

  for (const e of trip.expenses) {
    if (e.note && normalizeForMatch(e.note).includes(needle)) {
      matches.push({ type: 'expense', id: e.id, label: e.note, tab: 'budget' });
    }
  }

  // Tab is 'flights' (not a new tab id) — the Bookings screen's specific
  // sub-view is client-side UI state, so a match just lands on its default view.
  for (const b of trip.bookingItems) {
    if (normalizeForMatch(b.name).includes(needle)) {
      matches.push({ type: 'booking', id: b.id, label: b.name, tab: 'flights' });
    }
  }

  return matches;
}
