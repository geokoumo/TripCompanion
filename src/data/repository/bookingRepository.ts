import type { Trip } from '../../features/trips/types';
import type { BookingItem } from '../../features/bookings/types';

/** Pure entity-level operations on a trip's booking items — see expenseRepository.ts for why these are Trip -> Trip functions rather than direct Supabase calls. */

/** Inserts a new booking item, or replaces the one with a matching id. */
export function upsertBookingItem(trip: Trip, item: BookingItem): Trip {
  const exists = trip.bookingItems.some((b) => b.id === item.id);
  return {
    ...trip,
    bookingItems: exists ? trip.bookingItems.map((b) => (b.id === item.id ? item : b)) : [...trip.bookingItems, item],
  };
}
