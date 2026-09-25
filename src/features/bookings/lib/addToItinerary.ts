import { BOOKING_ITEM_TO_STOP_TYPE, type BookingItemTypeId } from '../../../config/constants';
import { generateId } from '../../../shared/lib/id';
import type { ItineraryStop } from '../../itinerary/types';
import { describeActivityError, validateStopForSave } from '../../itinerary/lib/activityValidation';
import type { Trip } from '../../trips/types';
import type { BookingItem } from '../types';

const DEFAULT_DURATION_MINUTES = 60;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export type LinkedStopResult = { stop: ItineraryStop } | { conflictMessage: string };

/**
 * Builds the itinerary stop a booking item's "Add to itinerary" toggle
 * pre-fills — same manual-entry philosophy as everything else, just copying
 * over data already typed into the booking form. Runs through the exact
 * same canonical validateStopForSave a manually-created or idea-created
 * stop goes through (date range, time/duration, price/currency, location,
 * and overlap against the rest of the itinerary) rather than a narrower,
 * booking-specific check — so a booking-derived stop can never slip past a
 * rule a manual one would be blocked by.
 */
export function buildLinkedItineraryStop(trip: Trip, item: BookingItem): LinkedStopResult {
  if (!item.date || !item.startTime) {
    return { conflictMessage: 'Add a date and start time to add this to the itinerary.' };
  }

  const startMin = toMinutes(item.startTime);
  const durationMinutes = item.endTime ? Math.max(toMinutes(item.endTime) - startMin, 15) : DEFAULT_DURATION_MINUTES;

  const stop: ItineraryStop = {
    id: generateId(),
    legId: item.legId ?? undefined,
    date: item.date,
    time: item.startTime,
    allDay: false,
    durationMinutes,
    title: item.name,
    type: BOOKING_ITEM_TO_STOP_TYPE[item.type as BookingItemTypeId],
    location: item.location ?? undefined,
    price: item.price ?? undefined,
    currency: item.currency ?? undefined,
    travelerIds: [],
    done: false,
  };

  const errors = validateStopForSave(stop, trip, trip.itineraryStops);
  if (errors.length > 0) {
    return { conflictMessage: `Couldn't add to itinerary — ${describeActivityError(errors[0]!, trip.itineraryStops)}` };
  }
  return { stop };
}
