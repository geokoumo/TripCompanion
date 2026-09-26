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
import styles from './StayDetailView.module.css';

interface StayDetailViewProps {
  stay: Stay;
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<{ ok: boolean } | void>;
  onClose: () => void;
  onEdit: () => void;
}

/**
 * Read-only "View Details" for a stay — opened from a tap on StayCard
 * instead of jumping straight into StayForm. The check-in/check-out grid
 * mirrors StayCard's own two-column layout (same visual system as the
 * list, not a second one); the Modal's own title already carries the
 * property name, so the body leads with address/phone instead of
 * repeating it.
 */
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
      <div className={styles.hero}>
        <div className={styles.eyebrow}>Stay</div>
        <div className={styles.address}>{stay.address}</div>
        {stay.phone && <div className={styles.phone}>{stay.phone}</div>}
      </div>

      <div className={styles.stayGrid}>
        <div>
          <div className={styles.gridLabel}>Check-in</div>
          <div className={styles.gridValue}>{formatDateNoYear(stay.checkinDate)}</div>
          <div className={styles.gridSub}>{stay.checkinTime}</div>
        </div>
        <div className={styles.gridColRight}>
          <div className={styles.gridLabel}>Check-out</div>
          <div className={styles.gridValue}>{formatDateNoYear(stay.checkoutDate)}</div>
          <div className={styles.gridSub}>{stay.checkoutTime}</div>
        </div>
      </div>

      <DetailSection>
        {nights > 0 && <DetailRow label="Length of stay" value={nights === 1 ? '1 night' : `${nights} nights`} />}
        {stay.bookingRef && <DetailRow label="Booking reference" value={stay.bookingRef} />}
        {stay.link && <DetailLinkRow label="Link" href={stay.link} />}
      </DetailSection>

      {stay.notes && <DetailBlock label="Notes" value={stay.notes} />}

      <ItemDocumentsSection trip={trip} relatedTo={stayRelatedTo(stay)} sourceType="stay" sourceId={stay.id} onOpenDocument={setViewingDoc} />

      {viewingDoc && <DocumentDetailSheet doc={viewingDoc} trip={trip} updateTrip={updateTrip} onClose={() => setViewingDoc(null)} />}
    </Modal>
  );
}
