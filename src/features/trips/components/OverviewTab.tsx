import { useMemo, useState } from 'react';
import { Card } from '../../../shared/components/Card';
import { IconCircle, type IconTone } from '../../../shared/components/IconCircle';
import { StampBadge } from '../../../shared/components/StampBadge';
import { EmptyState } from '../../../shared/components/EmptyState';
import { BedIcon, EyeIcon, PlaneIcon } from '../../../shared/components/icons';
import { BOOKING_TYPE_ICON } from '../../bookings/lib/bookingGridConfig';
import { DocumentDetailSheet } from '../../documents/components/DocumentDetailSheet';
import { documentIconFor, DOCUMENT_CATEGORY_TONE } from '../../documents/lib/documentIcon';
import type { Document } from '../../documents/types';
import { computeTotalSpent } from '../../budget/lib/currency';
import { dayNumber, formatDateNoYear, formatDateShort, daysBetween, nowTimeStr, todayStr } from '../../../shared/lib/dateFormat';
import { TripHealthBanner } from '../../tripHealth/components/TripHealthBanner';
import { computeTripHealth } from '../../tripHealth/lib/computeTripHealth';
import { getTripDateRange } from '../lib/dateRange';
import { getActiveBookingSummary, type BookingSummaryKind } from '../lib/bookingSummary';
import { buildTripMoments, formatRelativeMinutes, getCurrentAndNextMoment, minutesUntilMoment, type TimelineMoment } from '../lib/timeline';
import { getTripStatus, type Trip } from '../types';
import styles from './OverviewTab.module.css';

interface OverviewTabProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
  onOpenTripHealth: () => void;
}

function bookingSummaryIcon(kind: BookingSummaryKind): { Icon: typeof PlaneIcon; tone: IconTone } {
  if (kind === 'flight') return { Icon: PlaneIcon, tone: 'rust' };
  if (kind === 'stay') return { Icon: BedIcon, tone: 'teal' };
  return BOOKING_TYPE_ICON[kind];
}

function EventBlock({ label, tone, moment, today, nowTime }: { label: string; tone: 'teal' | 'gray'; moment: TimelineMoment; today: string; nowTime: string }) {
  return (
    <div className={styles.eventBlock}>
      <div className={styles.eventTopRow}>
        <span className={styles.eventLead}>
          <StampBadge tone={tone}>{label}</StampBadge>
          <span className={styles.eventWhen}>
            {formatDateNoYear(moment.date)} · {moment.time}
          </span>
        </span>
        <span className={styles.eventCountdown}>{formatRelativeMinutes(minutesUntilMoment(moment, today, nowTime))}</span>
      </div>
      <div className={styles.eventTitle}>{moment.title}</div>
      {moment.subtitle && <div className={styles.eventSubtitle}>{moment.subtitle}</div>}
    </div>
  );
}

export function OverviewTab({ trip, updateTrip, onOpenTripHealth }: OverviewTabProps) {
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const range = getTripDateRange(trip.legs, trip.flights);
  const today = todayStr();
  const nowTime = nowTimeStr();
  const status = getTripStatus(range);

  const { warnings } = useMemo(() => computeTripHealth(trip, today), [trip, today]);

  const moments = useMemo(
    () => buildTripMoments(trip.flights, trip.stays, trip.itineraryStops),
    [trip.flights, trip.stays, trip.itineraryStops],
  );
  const { current, next } = useMemo(() => getCurrentAndNextMoment(moments, today, nowTime), [moments, today, nowTime]);

  const bookingSummary = useMemo(
    () => getActiveBookingSummary(trip.flights, trip.stays, trip.bookingItems, today),
    [trip.flights, trip.stays, trip.bookingItems, today],
  );

  const { total: budgetSpent } = computeTotalSpent(trip.expenses, trip.homeCurrency);
  const packingDone = trip.checklistItems.filter((i) => i.done).length;

  const recentDocuments = [...trip.documents].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).slice(0, 3);

  const sortedStops = [...trip.itineraryStops].sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')));

  let statusPillLabel: string | null = null;
  let statusPillTone: 'rust' | 'teal' = 'rust';
  if (range && status !== 'completed') {
    if (status === 'upcoming') {
      const days = daysBetween(today, range.startDate);
      statusPillLabel = days === 1 ? 'In 1 day' : `In ${days} days`;
    } else {
      const totalDays = daysBetween(range.startDate, range.endDate) + 1;
      const currentDay = Math.min(Math.max(daysBetween(range.startDate, today) + 1, 1), totalDays);
      statusPillLabel = `Day ${currentDay} of ${totalDays}`;
      statusPillTone = 'teal';
    }
  }

  const legSummary =
    trip.legs.length > 0
      ? trip.legs.map((leg) => `${leg.city || 'Unknown'} (${formatDateNoYear(leg.startDate)}-${formatDateNoYear(leg.endDate)})`).join(' → ')
      : null;

  const travelersLine = trip.travelers.length > 0 ? `Travelers: ${trip.travelers.map((t) => t.name).join(', ')}` : null;

  const nothingYet =
    trip.flights.length === 0 && trip.stays.length === 0 && trip.itineraryStops.length === 0 && trip.bookingItems.length === 0;

  return (
    <div className={styles.wrapper}>
      {trip.description && <p className={styles.description}>{trip.description}</p>}

      {range && (
        <div className={styles.metaBlock}>
          <div className={styles.metaTopRow}>
            <span className={styles.dateRange}>
              {formatDateShort(range.startDate)} – {formatDateShort(range.endDate)}
            </span>
            {statusPillLabel && <StampBadge tone={statusPillTone}>{statusPillLabel.toUpperCase()}</StampBadge>}
          </div>
          {legSummary && <div className={styles.metaLine}>{legSummary}</div>}
          {travelersLine && <div className={styles.metaLine}>{travelersLine}</div>}
        </div>
      )}

      {nothingYet && <EmptyState headline="Nothing yet" body="Add flights, a stay, or a booking and they'll show up here." />}

      {(current || next) && (
        <Card className={styles.eventsCard}>
          <div className={styles.sectionTitle}>Important Events</div>
          {current && <EventBlock label="CURRENT" tone="teal" moment={current} today={today} nowTime={nowTime} />}
          {next && <EventBlock label="NEXT" tone="gray" moment={next} today={today} nowTime={nowTime} />}
        </Card>
      )}

      <TripHealthBanner warnings={warnings} onOpen={onOpenTripHealth} />

      <div className={styles.statsGrid}>
        <div className={styles.statTile}>
          <div className={styles.statLabel}>Budget Spent</div>
          <div className={styles.statValue}>
            {budgetSpent.toFixed(2)} {trip.homeCurrency}
          </div>
        </div>
        <div className={styles.statTile}>
          <div className={styles.statLabel}>Packing Progress</div>
          <div className={styles.statValue}>
            {packingDone} of {trip.checklistItems.length} items
          </div>
        </div>
      </div>

      {recentDocuments.length > 0 && (
        <div className={styles.listSection}>
          <div className={styles.sectionTitle}>Documents</div>
          {recentDocuments.map((doc) => {
            const Icon = documentIconFor(doc);
            return (
              <Card key={doc.id} className={styles.docRow}>
                <IconCircle tone={DOCUMENT_CATEGORY_TONE[doc.category]} size={32}>
                  <Icon size={16} />
                </IconCircle>
                <span className={styles.docTitle}>{doc.title}</span>
                <button type="button" className={styles.eyeButton} onClick={() => setViewingDoc(doc)} aria-label={`View ${doc.title}`}>
                  <EyeIcon size={16} />
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {sortedStops.length > 0 && (
        <Card className={styles.listCard}>
          <div className={styles.sectionTitleRow}>
            <span className={styles.sectionTitle}>Compact Itinerary</span>
            <span className={styles.sectionCount}>
              {sortedStops.length} stop{sortedStops.length === 1 ? '' : 's'}
            </span>
          </div>
          {sortedStops.slice(0, 5).map((stop) => (
            <div key={stop.id} className={styles.listRow}>
              <IconCircle tone="gray" size={28}>
                <span className={styles.dayNumber}>{dayNumber(stop.date)}</span>
              </IconCircle>
              <div className={styles.listRowMain}>
                <div className={styles.listRowTitle}>{stop.title}</div>
                <div className={styles.listRowSubtitle}>
                  {formatDateNoYear(stop.date)}
                  {stop.location ? ` · ${stop.location}` : ''}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {bookingSummary.length > 0 && (
        <Card className={styles.listCard}>
          <div className={styles.sectionTitleRow}>
            <span className={styles.sectionTitle}>Booking Summary</span>
            <span className={styles.sectionCount}>{bookingSummary.length} active</span>
          </div>
          {bookingSummary.slice(0, 6).map((entry) => {
            const { Icon, tone } = bookingSummaryIcon(entry.kind);
            return (
              <div key={entry.id} className={styles.listRow}>
                <IconCircle tone={tone} size={28}>
                  <Icon size={14} />
                </IconCircle>
                <div className={styles.listRowMain}>
                  <div className={styles.listRowTitle}>{entry.name}</div>
                  <div className={styles.listRowSubtitle}>{entry.subtitle}</div>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {viewingDoc && <DocumentDetailSheet doc={viewingDoc} trip={trip} updateTrip={updateTrip} onClose={() => setViewingDoc(null)} />}
    </div>
  );
}
