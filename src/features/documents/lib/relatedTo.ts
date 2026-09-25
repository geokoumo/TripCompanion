import { BOOKING_ITEM_TYPES } from '../../../config/constants';
import type { BookingItem } from '../../bookings/types';
import type { Flight } from '../../flights/types';
import type { Stay } from '../../stays/types';
import type { Document, DocumentSourceType } from '../types';

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

/**
 * Whether `doc` belongs to a given source entity — the single place both
 * matching strategies live (F-11). Prefers the stable sourceType/sourceId
 * identity when the document has one: immune to a rename, and to a label
 * collision with an unrelated entity (e.g. two stays that happen to share a
 * name). Falls back to the legacy relatedTo label match for a document that
 * predates this field, or was added via AddDocumentForm's free-text entry,
 * which has no single source record to derive an id from.
 */
export function documentBelongsToSource(doc: Document, sourceType: DocumentSourceType, sourceId: string, label: string): boolean {
  if (doc.sourceType && doc.sourceId) return doc.sourceType === sourceType && doc.sourceId === sourceId;
  return doc.relatedTo === label;
}

/**
 * Repoints every document belonging to a source entity onto its new
 * `to` label, so renaming a flight/stay/booking item (which changes what
 * flightRelatedTo/stayRelatedTo/bookingItemRelatedTo compute for it) never
 * silently orphans its attachments from that record's own View Details.
 * Matches via documentBelongsToSource, so a document carrying a stable
 * sourceId is found and retagged correctly even if its OLD relatedTo label
 * happened to collide with a different entity's — only the display label
 * (relatedTo) is ever rewritten, sourceId itself never changes. A no-op
 * when the label hasn't changed.
 */
export function retagDocuments(documents: Document[], sourceType: DocumentSourceType, sourceId: string, from: string, to: string): Document[] {
  if (from === to) return documents;
  return documents.map((d) => (documentBelongsToSource(d, sourceType, sourceId, from) ? { ...d, relatedTo: to } : d));
}
