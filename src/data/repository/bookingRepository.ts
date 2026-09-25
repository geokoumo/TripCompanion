import { bookingItemRelatedTo, retagDocuments } from '../../features/documents/lib/relatedTo';
import type { Trip } from '../../features/trips/types';
import type { BookingItem } from '../../features/bookings/types';

/** Pure entity-level operations on a trip's booking items — see expenseRepository.ts for why these are Trip -> Trip functions rather than direct Supabase calls. */

/**
 * Inserts a new booking item, or replaces the one with a matching id. On an
 * edit that changes the item's documents.relatedTo label (name/type), also
 * repoints any attached documents so a rename never orphans them from the
 * item's own View Details — see documents/lib/relatedTo.ts.
 */
export function upsertBookingItem(trip: Trip, item: BookingItem): Trip {
  const existing = trip.bookingItems.find((b) => b.id === item.id);
  const bookingItems = existing ? trip.bookingItems.map((b) => (b.id === item.id ? item : b)) : [...trip.bookingItems, item];
  const documents = existing ? retagDocuments(trip.documents, 'booking', item.id, bookingItemRelatedTo(existing), bookingItemRelatedTo(item)) : trip.documents;
  return { ...trip, bookingItems, documents };
}
