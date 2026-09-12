import { formatDateNoYear, daysBetween } from '../../../shared/lib/dateFormat';
import type { BookingItemTypeId } from '../../../config/constants';
import type { Flight } from '../../flights/types';
import type { Stay } from '../../stays/types';
import type { BookingItem } from '../../bookings/types';

export type BookingSummaryKind = 'flight' | 'stay' | BookingItemTypeId;

export interface BookingSummaryEntry {
  id: string;
  kind: BookingSummaryKind;
  name: string;
  subtitle: string;
}

interface Candidate {
  sortKey: string;
  entry: BookingSummaryEntry;
}

/**
 * Every flight, stay, and booking item that hasn't concluded yet as of
 * `today` — a flight that has already landed, or a stay already checked out
 * of, drops off; an undated booking item (no fixed date yet) never counts
 * as concluded and sorts last. Chronologically ordered by each item's
 * relevant date.
 */
export function getActiveBookingSummary(flights: Flight[], stays: Stay[], bookingItems: BookingItem[], today: string): BookingSummaryEntry[] {
  const candidates: Candidate[] = [];

  for (const flight of flights) {
    if (flight.arrDate < today) continue;
    candidates.push({
      sortKey: flight.depDate,
      entry: {
        id: `flight-${flight.id}`,
        kind: 'flight',
        name: `${flight.airline} ${flight.flightNumber}`,
        subtitle: `${formatDateNoYear(flight.depDate)} · ${flight.depAirport} → ${flight.arrAirport}`,
      },
    });
  }

  for (const stay of stays) {
    if (stay.checkoutDate < today) continue;
    const nights = daysBetween(stay.checkinDate, stay.checkoutDate);
    candidates.push({
      sortKey: stay.checkinDate,
      entry: {
        id: `stay-${stay.id}`,
        kind: 'stay',
        name: stay.name,
        subtitle: `${formatDateNoYear(stay.checkinDate)} · ${nights} night${nights === 1 ? '' : 's'}`,
      },
    });
  }

  for (const item of bookingItems) {
    if (item.date && item.date < today) continue;
    const subtitle = [item.date ? formatDateNoYear(item.date) : null, item.location].filter(Boolean).join(' · ');
    candidates.push({
      sortKey: item.date ?? '9999-99-99',
      entry: {
        id: `booking-${item.id}`,
        kind: item.type,
        name: item.name,
        subtitle,
      },
    });
  }

  return candidates.sort((a, b) => a.sortKey.localeCompare(b.sortKey)).map((c) => c.entry);
}
