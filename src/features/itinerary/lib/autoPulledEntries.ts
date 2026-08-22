import type { Flight } from '../../flights/types';
import type { Stay } from '../../stays/types';
import type { AutoPulledEntry } from '../types';

/**
 * Merges flights and stays into read-only timeline entries: each flight
 * contributes a departure entry and an arrival entry; each stay contributes
 * a check-in entry and a check-out entry.
 */
export function buildAutoPulledEntries(flights: Flight[], stays: Stay[]): AutoPulledEntry[] {
  const entries: AutoPulledEntry[] = [];

  for (const flight of flights) {
    entries.push({
      id: `flight-dep-${flight.id}`,
      date: flight.depDate,
      time: flight.depTime,
      title: `Αναχώρηση πτήσης ${flight.airline} ${flight.flightNumber} — ${flight.depAirport}`,
      source: 'flight',
      kind: 'departure',
      sourceId: flight.id,
    });
    entries.push({
      id: `flight-arr-${flight.id}`,
      date: flight.arrDate,
      time: flight.arrTime,
      title: `Άφιξη πτήσης ${flight.airline} ${flight.flightNumber} — ${flight.arrAirport}`,
      source: 'flight',
      kind: 'arrival',
      sourceId: flight.id,
    });
  }

  for (const stay of stays) {
    entries.push({
      id: `stay-checkin-${stay.id}`,
      date: stay.checkinDate,
      time: stay.checkinTime,
      title: `Check-in — ${stay.name}`,
      source: 'stay',
      kind: 'checkin',
      sourceId: stay.id,
    });
    entries.push({
      id: `stay-checkout-${stay.id}`,
      date: stay.checkoutDate,
      time: stay.checkoutTime,
      title: `Check-out — ${stay.name}`,
      source: 'stay',
      kind: 'checkout',
      sourceId: stay.id,
    });
  }

  return entries.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export function groupAutoPulledByDate(entries: AutoPulledEntry[]): Map<string, AutoPulledEntry[]> {
  const map = new Map<string, AutoPulledEntry[]>();
  for (const entry of entries) {
    const list = map.get(entry.date) ?? [];
    list.push(entry);
    map.set(entry.date, list);
  }
  return map;
}
