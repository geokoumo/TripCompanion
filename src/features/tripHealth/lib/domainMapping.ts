import type { Trip as DomainTrip, Stay as DomainStay } from '../../../domain';
import { toDomainActivity, tripActivityRange } from '../../itinerary/lib/activityValidation';
import type { Trip } from '../../trips/types';
import type { Stay } from '../../stays/types';

/** Maps the app's persisted Stay onto the domain layer's Stay shape — field-compatible by design, see src/domain/schemas.ts. */
export function toDomainStay(stay: Stay): DomainStay {
  return {
    id: stay.id,
    name: stay.name,
    address: stay.address,
    checkinDate: stay.checkinDate,
    checkinTime: stay.checkinTime,
    checkoutDate: stay.checkoutDate,
    checkoutTime: stay.checkoutTime,
    bookingReference: stay.bookingRef ?? undefined,
  };
}

/**
 * Maps the app's persisted Trip onto the domain layer's Trip aggregate, for
 * the one call site that needs the whole thing: domain.validateTrip(). Only
 * the fields validateTrip actually reads (id/title/startDate/endDate/
 * travelers/activities/stays) are populated from real data — the rest of
 * the domain Trip shape (flights/bookings/documents/expenses/packingItems)
 * isn't touched by validateTrip today, so it's left empty here rather than
 * mapped for no reason. If validateTrip grows to check those too, map them
 * for real at that point instead of guessing ahead of time.
 */
export function toDomainTrip(trip: Trip): DomainTrip {
  const range = tripActivityRange(trip);
  return {
    id: trip.id,
    title: trip.title,
    startDate: range?.startDate ?? '',
    endDate: range?.endDate ?? '',
    homeCurrency: trip.homeCurrency,
    travelers: trip.travelers,
    activities: trip.itineraryStops.map(toDomainActivity),
    flights: [],
    stays: trip.stays.map(toDomainStay),
    bookings: [],
    documents: [],
    expenses: [],
    packingItems: [],
  };
}
