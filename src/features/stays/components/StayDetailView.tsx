import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { DetailBlock, DetailLinkRow, DetailRow, DetailSection } from '../../../shared/components/DetailView';
import { Modal } from '../../../shared/components/Modal';
import { daysBetween, formatDateNoYear } from '../../../shared/lib/dateFormat';
import { DocumentDetailSheet } from '../../documents/components/DocumentDetailSheet';
import { ItemDocumentsSection } from '../../documents/components/ItemDocumentsSection';
import { stayRelatedTo } from '../../documents/lib/relatedTo';
import type { Document } from '../../documents/types';
import type { Trip } from '../../trips/types';
import type { Stay } from '../types';

interface StayDetailViewProps {
  stay: Stay;
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
  onClose: () => void;
  onEdit: () => void;
}

/** Read-only "View Details" for a stay — opened from a tap on StayCard instead of jumping straight into StayForm. */
export function StayDetailView({ stay, trip, updateTrip, onClose, onEdit }: StayDetailViewProps) {
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const nights = daysBetween(stay.checkinDate, stay.checkoutDate);

  return (
    <Modal
      title={stay.name}
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onEdit}>
          Edit
        </Button>
      }
    >
      <DetailBlock label="Address" value={stay.address} />
      {stay.phone && <DetailRow label="Phone" value={stay.phone} />}

      <DetailSection title="Check-in">
        <DetailRow label="Date" value={formatDateNoYear(stay.checkinDate)} />
        <DetailRow label="Time" value={stay.checkinTime} />
      </DetailSection>

      <DetailSection title="Check-out">
        <DetailRow label="Date" value={formatDateNoYear(stay.checkoutDate)} />
        <DetailRow label="Time" value={stay.checkoutTime} />
      </DetailSection>

      <DetailSection>
        {nights > 0 && <DetailRow label="Length of stay" value={nights === 1 ? '1 night' : `${nights} nights`} />}
        {stay.bookingRef && <DetailRow label="Booking reference" value={stay.bookingRef} />}
        {stay.link && <DetailLinkRow label="Link" href={stay.link} />}
      </DetailSection>

      {stay.notes && <DetailBlock label="Notes" value={stay.notes} />}

      <ItemDocumentsSection trip={trip} relatedTo={stayRelatedTo(stay)} onOpenDocument={setViewingDoc} />

      {viewingDoc && <DocumentDetailSheet doc={viewingDoc} trip={trip} updateTrip={updateTrip} onClose={() => setViewingDoc(null)} />}
    </Modal>
  );
}
