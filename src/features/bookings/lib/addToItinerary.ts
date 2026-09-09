import { BOOKING_ITEM_TO_STOP_TYPE, type BookingItemTypeId } from '../../../config/constants';
import { generateId } from '../../../shared/lib/id';
import type { ItineraryStop } from '../../itinerary/types';
import { computeOccupiedRanges, findConflict, formatRangeLabel } from '../../itinerary/lib/occupiedRanges';
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
 * over data already typed into the booking form. Still goes through the
 * Round 8 hard-block: if the slot is already occupied, this refuses to
 * create an overlapping stop rather than silently bypassing that rule.
 */
export function buildLinkedItineraryStop(trip: Trip, item: BookingItem): LinkedStopResult {
  if (!item.date || !item.startTime) {
    return { conflictMessage: 'Add a date and start time to add this to the itinerary.' };
  }

  const startMin = toMinutes(item.startTime);
  const durationMinutes = item.endTime ? Math.max(toMinutes(item.endTime) - startMin, 15) : DEFAULT_DURATION_MINUTES;

  const occupied = computeOccupiedRanges({ date: item.date, stops: trip.itineraryStops, flights: trip.flights, stays: trip.stays });
  const conflict = findConflict(startMin, durationMinutes, occupied);
  if (conflict) {
    return { conflictMessage: `Couldn't add to itinerary — it overlaps with "${conflict.label}" ${formatRangeLabel(conflict)}.` };
  }

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
    travelerIds: [],
    done: false,
  };
  return { stop };
}
