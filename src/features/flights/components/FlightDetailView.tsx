import { useState } from 'react';
import { FLIGHT_STATUSES } from '../../../config/constants';
import { Button } from '../../../shared/components/Button';
import { DetailLinkRow, DetailRow, DetailSection } from '../../../shared/components/DetailView';
import { Modal } from '../../../shared/components/Modal';
import { StampBadge } from '../../../shared/components/StampBadge';
import { DocumentDetailSheet } from '../../documents/components/DocumentDetailSheet';
import { ItemDocumentsSection } from '../../documents/components/ItemDocumentsSection';
import { flightRelatedTo } from '../../documents/lib/relatedTo';
import type { Document } from '../../documents/types';
import type { Trip } from '../../trips/types';
import { FLIGHT_STATUS_TONE } from '../lib/statusTone';
import type { Flight } from '../types';
import { FlightJourneyHeader } from './FlightJourneyHeader';
import styles from './FlightDetailView.module.css';

interface FlightDetailViewProps {
  flight: Flight;
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
  onClose: () => void;
  onEdit: () => void;
}

/**
 * Read-only "View Details" for a flight — opened from a tap on FlightCard
 * instead of jumping straight into FlightForm. Leads with the same journey
 * header FlightCard itself uses (FlightJourneyHeader), so this reads as the
 * same Flight entity in both places rather than a second visual system.
 * Edit transitions to the existing form; nothing here writes to the trip.
 */
export function FlightDetailView({ flight, trip, updateTrip, onClose, onEdit }: FlightDetailViewProps) {
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const statusLabel = FLIGHT_STATUSES.find((s) => s.id === flight.status)?.label ?? flight.status;

  return (
    <Modal
      title={
        <span className={styles.titleRow}>
          {flight.airline} · {flight.flightNumber}
          <StampBadge tone={FLIGHT_STATUS_TONE[flight.status] ?? 'gray'}>{statusLabel}</StampBadge>
        </span>
      }
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onEdit}>
          Edit
        </Button>
      }
    >
      <div className={styles.journey}>
        <FlightJourneyHeader flight={flight} />
      </div>

      <DetailSection>
        {flight.terminal && <DetailRow label="Terminal" value={flight.terminal} />}
        {flight.gate && <DetailRow label="Gate" value={flight.gate} />}
        {flight.bookingRef && <DetailRow label="Booking reference" value={flight.bookingRef} />}
        {flight.link && <DetailLinkRow label="Link" href={flight.link} />}
      </DetailSection>

      <ItemDocumentsSection trip={trip} relatedTo={flightRelatedTo(flight)} sourceType="flight" sourceId={flight.id} onOpenDocument={setViewingDoc} />

      {viewingDoc && <DocumentDetailSheet doc={viewingDoc} trip={trip} updateTrip={updateTrip} onClose={() => setViewingDoc(null)} />}
    </Modal>
  );
}
