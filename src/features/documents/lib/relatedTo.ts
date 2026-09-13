import { BOOKING_ITEM_TYPES } from '../../../config/constants';
import type { BookingItem } from '../../bookings/types';
import type { Flight } from '../../flights/types';
import type { Stay } from '../../stays/types';

/**
 * The single source of truth for the free-text `documents.relatedTo` label
 * each entity type ties its attachments to (see documents/types.ts — it's
 * a label match, not a foreign key, since one documents table serves every
 * entity type). Shared by each entity's AttachmentsField usage (uploading)
 * and its View Details' documents section (reading), so the two can never
 * drift apart into computing two different strings for the same record.
 */

export function flightRelatedTo(flight: Pick<Flight, 'depAirport' | 'arrAirport'>): string {
  return flight.depAirport && flight.arrAirport ? `${flight.depAirport} → ${flight.arrAirport} flight` : 'Flight';
}

export function stayRelatedTo(stay: Pick<Stay, 'name'>): string {
  return stay.name || 'Stay';
}

export function bookingItemRelatedTo(item: Pick<BookingItem, 'name' | 'type'>): string {
  const config = BOOKING_ITEM_TYPES.find((t) => t.id === item.type);
  return item.name || config?.singular || 'Booking';
}
