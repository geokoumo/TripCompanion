import { useState } from 'react';
import { BOOKING_ITEM_TYPES } from '../../../config/constants';
import { Button } from '../../../shared/components/Button';
import { DetailBlock, DetailRow, DetailSection } from '../../../shared/components/DetailView';
import { Modal } from '../../../shared/components/Modal';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import { DocumentDetailSheet } from '../../documents/components/DocumentDetailSheet';
import { ItemDocumentsSection } from '../../documents/components/ItemDocumentsSection';
import { bookingItemRelatedTo } from '../../documents/lib/relatedTo';
import type { Document } from '../../documents/types';
import type { Trip } from '../../trips/types';
import type { BookingItem } from '../types';

interface BookingItemDetailViewProps {
  item: BookingItem;
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<{ ok: boolean } | void>;
  onClose: () => void;
  onEdit: () => void;
}

/**
 * Read-only "View Details" for a booking item (reservation) — opened from
 * a tap on BookingItemCard instead of jumping straight into BookingItemForm.
 *
 * No "link" row: unlike Flight/Stay/ItineraryStop, BookingItemSchema has no
 * link field today (see bookings/types.ts) — there's nothing to display,
 * not a gap in this view.
 */
export function BookingItemDetailView({ item, trip, updateTrip, onClose, onEdit }: BookingItemDetailViewProps) {
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const config = BOOKING_ITEM_TYPES.find((t) => t.id === item.type);
  const isTransport = item.type === 'transport';
  const showsPriceRange = item.type === 'restaurant' || item.type === 'bar';
  const showsPartySize = item.type === 'restaurant' || item.type === 'bar';
  const showsCategory = item.type === 'sight' || item.type === 'ticket' || item.type === 'activity' || item.type === 'other';

  const timeRange = item.startTime ? `${item.startTime}${item.endTime ? ` – ${item.endTime}` : ''}` : item.endTime;

  return (
    <Modal
      title={item.name}
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onEdit}>
          Edit
        </Button>
      }
    >
      <DetailSection>
        <DetailRow label="Type" value={config?.singular ?? item.type} />
        {isTransport ? (
          <>
            {item.details.fromLocation && <DetailRow label="From" value={item.details.fromLocation} />}
            {item.details.toLocation && <DetailRow label="To" value={item.details.toLocation} />}
          </>
        ) : (
          <>
            {item.location && <DetailRow label="Location" value={item.location} />}
            {item.address && <DetailRow label="Address" value={item.address} />}
          </>
        )}
        {showsCategory && item.details.category && <DetailRow label="Category" value={item.details.category} />}
        {item.type === 'restaurant' && item.details.cuisineType && <DetailRow label="Cuisine" value={item.details.cuisineType} />}
        {showsPriceRange && item.details.priceRange && <DetailRow label="Price range" value={item.details.priceRange} />}
      </DetailSection>

      <DetailSection>
        {item.date && <DetailRow label="Date" value={formatDateShort(item.date)} />}
        {timeRange && <DetailRow label="Time" value={timeRange} />}
        {item.price != null && <DetailRow label="Price" value={`${item.price} ${item.currency ?? trip.homeCurrency}`} />}
        {item.bookingReference && <DetailRow label="Booking reference" value={item.bookingReference} />}
        {showsPartySize && item.partySize != null && <DetailRow label="Party size" value={item.partySize} />}
        {isTransport && item.details.car && <DetailRow label="Car" value={item.details.car} />}
        {isTransport && item.details.seat && <DetailRow label="Seat" value={item.details.seat} />}
        {isTransport && item.details.platform && <DetailRow label="Platform" value={item.details.platform} />}
      </DetailSection>

      {item.notes && <DetailBlock label="Notes" value={item.notes} />}

      <ItemDocumentsSection trip={trip} relatedTo={bookingItemRelatedTo(item)} sourceType="booking" sourceId={item.id} onOpenDocument={setViewingDoc} />

      {viewingDoc && <DocumentDetailSheet doc={viewingDoc} trip={trip} updateTrip={updateTrip} onClose={() => setViewingDoc(null)} />}
    </Modal>
  );
}
