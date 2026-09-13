import { memo } from 'react';
import { FLIGHT_STATUSES } from '../../../config/constants';
import { Card } from '../../../shared/components/Card';
import { StampBadge } from '../../../shared/components/StampBadge';
import { FLIGHT_STATUS_TONE } from '../lib/statusTone';
import type { Flight } from '../types';
import { FlightJourneyHeader } from './FlightJourneyHeader';
import { describeCard } from '../../../shared/lib/accessibleLabel';
import styles from './FlightCard.module.css';

function FlightCardComponent({ flight, onOpen }: { flight: Flight; onOpen: (flight: Flight) => void }) {
  const statusLabel = FLIGHT_STATUSES.find((s) => s.id === flight.status)?.label ?? flight.status;
  const isCancelled = flight.status === 'cancelled';

  return (
    <Card muted={isCancelled} onClick={() => onOpen(flight)} aria-label={describeCard(`Open ${flight.airline} ${flight.flightNumber}`, statusLabel)}>
      <div className={styles.topRow}>
        <span className={styles.airlineLine}>
          {flight.airline} · {flight.flightNumber}
        </span>
        <StampBadge tone={FLIGHT_STATUS_TONE[flight.status] ?? 'gray'}>{statusLabel}</StampBadge>
      </div>
      <FlightJourneyHeader flight={flight} />
      {(flight.terminal || flight.gate || flight.bookingRef) && (
        <div className={styles.footer}>
          {flight.terminal && (
            <span className={styles.footerItem}>
              <span className={styles.footerLabel}>Term</span>
              {flight.terminal}
            </span>
          )}
          {flight.gate && (
            <span className={styles.footerItem}>
              <span className={styles.footerLabel}>Gate</span>
              {flight.gate}
            </span>
          )}
          {flight.bookingRef && (
            <span className={styles.footerItem} data-align="end">
              <span className={styles.footerLabel}>Ref</span>
              {flight.bookingRef}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

export const FlightCard = memo(FlightCardComponent);
