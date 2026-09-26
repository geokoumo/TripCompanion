import { useMemo, useState } from 'react';
import { useToast } from '../../../app/providers/ToastProvider';
import { BOOKING_ITEM_TYPES, FLIGHT_STATUSES } from '../../../config/constants';
import { Card } from '../../../shared/components/Card';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { EmptyState } from '../../../shared/components/EmptyState';
import { StampBadge } from '../../../shared/components/StampBadge';
import { TicketIcon } from '../../../shared/components/icons';
import { deleteEntityWithUndo } from '../../../shared/lib/deleteWithUndo';
import { assertExists } from '../../../shared/lib/updateTripAbort';
import { describeCard } from '../../../shared/lib/accessibleLabel';
import { formatDateNoYear } from '../../../shared/lib/dateFormat';
import { upsertBookingItem } from '../../../data/repository/bookingRepository';
import { flightRelatedTo, stayRelatedTo, bookingItemRelatedTo, documentBelongsToSource, retagDocuments } from '../../documents/lib/relatedTo';
import { FlightDetailView } from '../../flights/components/FlightDetailView';
import { FlightForm } from '../../flights/components/FlightForm';
import { FLIGHT_STATUS_TONE } from '../../flights/lib/statusTone';
import type { Flight } from '../../flights/types';
import { findStopsOutOfRange, outOfRangeStopsMessage } from '../../itinerary/lib/outOfRangeStops';
import { StayDetailView } from '../../stays/components/StayDetailView';
import { StayForm } from '../../stays/components/StayForm';
import type { Stay } from '../../stays/types';
import { addRememberedLocation } from '../../trips/lib/rememberedLocations';
import type { Trip } from '../../trips/types';
import { buildLinkedItineraryStop } from '../lib/addToItinerary';
import type { BookingItem } from '../types';
import { BookingItemDetailView } from './BookingItemDetailView';
import { BookingItemForm } from './BookingItemForm';
import styles from './BookingsHub.module.css';

interface HubRow {
  id: string;
  kind: 'flight' | 'stay' | 'booking';
  sortKey: string;
  title: string;
  typeLabel: string;
  dateLabel: string | null;
  /** Only Flight has a real status field with an established colored-pill treatment (FlightCard already renders it this way) — everything else renders as plain right-aligned text, never a manufactured status pill. */
  statusPill: { label: string; tone: 'teal' | 'rust' | 'gray' | 'brass' } | null;
  statusText: string | null;
  hasDoc: boolean;
}

interface PendingDelete {
  kind: 'flight' | 'stay' | 'booking';
  id: string;
  name: string;
  /** The record's current documents.relatedTo label — see documents/lib/relatedTo.ts — so a confirmed delete can detach its documents instead of orphaning them. */
  relatedTo: string;
}

/**
 * "All" — the unified, chronological feed across flights, stays, and every
 * booking_items type, so a trip's bookings read as one connected set
 * instead of separate mini-apps per type (the per-type pills above this in
 * BookingsTab still exist for focused management of just one type).
 *
 * This never duplicates a record: every row is a thin projection of the
 * exact same trip.flights/trip.stays/trip.bookingItems arrays the
 * dedicated Flights/Stays/BookingItemsListScreen tabs already read and
 * write, reusing their own View/Edit/Delete components verbatim.
 */
export function BookingsHub({ trip, updateTrip }: { trip: Trip; updateTrip: (updater: (t: Trip) => Trip) => Promise<{ ok: boolean } | void> }) {
  const { showToast } = useToast();

  const [viewingFlight, setViewingFlight] = useState<Flight | null>(null);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [viewingStay, setViewingStay] = useState<Stay | null>(null);
  const [editingStay, setEditingStay] = useState<Stay | null>(null);
  const [viewingBooking, setViewingBooking] = useState<BookingItem | null>(null);
  const [editingBooking, setEditingBooking] = useState<BookingItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const rows = useMemo<HubRow[]>(() => {
    const flightRows: HubRow[] = trip.flights.map((f) => ({
      id: f.id,
      kind: 'flight',
      sortKey: `${f.depDate}${f.depTime}`,
      title: `${f.airline} ${f.flightNumber}`,
      typeLabel: 'Flight',
      dateLabel: `${formatDateNoYear(f.depDate)} · ${f.depAirport} → ${f.arrAirport}`,
      statusPill: {
        label: FLIGHT_STATUSES.find((s) => s.id === f.status)?.label ?? f.status,
        tone: FLIGHT_STATUS_TONE[f.status] ?? 'gray',
      },
      statusText: null,
      hasDoc: trip.documents.some((d) => documentBelongsToSource(d, 'flight', f.id, flightRelatedTo(f))),
    }));
    const stayRows: HubRow[] = trip.stays.map((s) => ({
      id: s.id,
      kind: 'stay',
      sortKey: `${s.checkinDate}${s.checkinTime}`,
      title: s.name,
      typeLabel: 'Stay',
      dateLabel: `${formatDateNoYear(s.checkinDate)} – ${formatDateNoYear(s.checkoutDate)}`,
      statusPill: null,
      // Not an invented status field — Stay has none. This restates the
      // real check-in time as context, the same choice the Figma reference
      // makes for a stay row.
      statusText: `Check-in ${s.checkinTime}`,
      hasDoc: trip.documents.some((d) => documentBelongsToSource(d, 'stay', s.id, stayRelatedTo(s))),
    }));
    const bookingRows: HubRow[] = trip.bookingItems.map((b) => {
      const config = BOOKING_ITEM_TYPES.find((t) => t.id === b.type);
      return {
        id: b.id,
        kind: 'booking',
        sortKey: `${b.date ?? '9999-99-99'}${b.startTime ?? '99:99'}`,
        title: b.name,
        typeLabel: config?.singular ?? b.type,
        dateLabel: b.date ? `${formatDateNoYear(b.date)}${b.startTime ? ` · ${b.startTime}` : ''}` : null,
        statusPill: null,
        // BookingItem has no status field — never inventing one (Figma's
        // "Ticket Ready"/"Booked"/"Planned" labels have no backing data).
        // Party size, when set, is real data worth surfacing here instead.
        statusText: b.partySize ? `${b.partySize} guest${b.partySize === 1 ? '' : 's'}` : null,
        hasDoc: trip.documents.some((d) => documentBelongsToSource(d, 'booking', b.id, bookingItemRelatedTo(b))),
      };
    });
    return [...flightRows, ...stayRows, ...bookingRows].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [trip.flights, trip.stays, trip.bookingItems, trip.documents]);

  const openRow = (row: HubRow) => {
    if (row.kind === 'flight') setViewingFlight(trip.flights.find((f) => f.id === row.id) ?? null);
    else if (row.kind === 'stay') setViewingStay(trip.stays.find((s) => s.id === row.id) ?? null);
    else setViewingBooking(trip.bookingItems.find((b) => b.id === row.id) ?? null);
  };

  const saveFlight = async (flight: Flight) => {
    const isEdit = editingFlight !== null;
    let outOfRangeMessage: string | null = null;
    const result = await updateTrip((t) => {
      if (isEdit) assertExists(t.flights, flight.id, 'This flight was already deleted elsewhere.');
      const existing = t.flights.find((f) => f.id === flight.id);
      const flights = existing ? t.flights.map((f) => (f.id === flight.id ? flight : f)) : [...t.flights, flight];
      const documents = existing ? retagDocuments(t.documents, 'flight', flight.id, flightRelatedTo(existing), flightRelatedTo(flight)) : t.documents;
      const next = { ...t, flights, documents };
      outOfRangeMessage = outOfRangeStopsMessage(findStopsOutOfRange(next)); // F-05
      return next;
    });
    if (result && !result.ok) return;
    showToast('Flight saved.');
    if (outOfRangeMessage) showToast(outOfRangeMessage, { variant: 'warn' });
    setEditingFlight(null);
  };

  const saveStay = async (stay: Stay) => {
    const isEdit = editingStay !== null;
    let outOfRangeMessage: string | null = null;
    const result = await updateTrip((t) => {
      if (isEdit) assertExists(t.stays, stay.id, 'This stay was already deleted elsewhere.');
      const existing = t.stays.find((s) => s.id === stay.id);
      const stays = existing ? t.stays.map((s) => (s.id === stay.id ? stay : s)) : [...t.stays, stay];
      const rememberedLocations = stay.address ? addRememberedLocation(t.rememberedLocations, stay.address) : t.rememberedLocations;
      const documents = existing ? retagDocuments(t.documents, 'stay', stay.id, stayRelatedTo(existing), stayRelatedTo(stay)) : t.documents;
      const next = { ...t, stays, rememberedLocations, documents };
      outOfRangeMessage = outOfRangeStopsMessage(findStopsOutOfRange(next)); // F-05
      return next;
    });
    if (result && !result.ok) return;
    showToast('Stay saved.');
    if (outOfRangeMessage) showToast(outOfRangeMessage, { variant: 'warn' });
    setEditingStay(null);
  };

  const saveBooking = async (item: BookingItem, addToItinerary: boolean) => {
    const isEdit = editingBooking !== null;
    // The booking item itself must always persist — a failed itinerary
    // side-effect (F-02/F-19) is never a reason to lose the user's edit, and
    // a stop that couldn't be added is reported on its own rather than
    // stacked with a "saved" toast the user would have to reconcile.
    let itineraryError: string | undefined;
    const result = await updateTrip((t) => {
      if (isEdit) assertExists(t.bookingItems, item.id, 'This booking was already deleted elsewhere.');
      // Conflict-checked against the fresh trip updateTrip just fetched, not
      // the stale `trip` prop this screen opened with.
      let stopToAdd: Trip['itineraryStops'][number] | undefined;
      if (addToItinerary) {
        const linked = buildLinkedItineraryStop(t, item);
        if ('conflictMessage' in linked) {
          itineraryError = linked.conflictMessage;
        } else {
          stopToAdd = linked.stop;
        }
      }
      const withItem = upsertBookingItem(t, item);
      return { ...withItem, itineraryStops: stopToAdd ? [...t.itineraryStops, stopToAdd] : t.itineraryStops };
    });
    if (result && !result.ok) return;
    showToast(itineraryError ?? `${BOOKING_ITEM_TYPES.find((t) => t.id === item.type)?.singular ?? 'Booking'} saved.`, itineraryError ? { variant: 'error' } : undefined);
    setEditingBooking(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const arrayKey = pendingDelete.kind === 'flight' ? 'flights' : pendingDelete.kind === 'stay' ? 'stays' : 'bookingItems';
    deleteEntityWithUndo({
      updateTrip,
      showToast,
      arrayKey,
      id: pendingDelete.id,
      clearDocumentsRelatedTo: pendingDelete.relatedTo,
      clearDocumentsSourceType: pendingDelete.kind,
      clearDocumentsSourceId: pendingDelete.id,
    });
    setPendingDelete(null);
    setEditingFlight(null);
    setEditingStay(null);
    setEditingBooking(null);
  };

  return (
    <div>
      {rows.length === 0 && (
        <EmptyState headline="Nothing here yet" body="Flights, stays, and bookings you add to this trip will show up here." />
      )}

      {rows.map((row) => (
        <Card
          key={`${row.kind}-${row.id}`}
          accent={row.hasDoc ? 'teal' : undefined}
          onClick={() => openRow(row)}
          aria-label={describeCard(`Open ${row.title}`, row.statusPill?.label, row.statusText, row.hasDoc && 'document attached')}
        >
          <div className={styles.topRow}>
            <span className={styles.typeLabel}>{row.typeLabel}</span>
            {row.statusPill && <StampBadge tone={row.statusPill.tone}>{row.statusPill.label}</StampBadge>}
            {row.statusText && <span className={styles.statusText}>{row.statusText}</span>}
          </div>
          <div className={styles.title}>{row.title}</div>
          <div className={styles.metaRow}>
            {row.dateLabel && <span>{row.dateLabel}</span>}
            {row.hasDoc && (
              <span className={styles.docBadge}>
                <TicketIcon size={14} />
                Doc attached
              </span>
            )}
          </div>
        </Card>
      ))}

      {viewingFlight && (
        <FlightDetailView
          flight={viewingFlight}
          trip={trip}
          updateTrip={updateTrip}
          onClose={() => setViewingFlight(null)}
          onEdit={() => {
            setEditingFlight(viewingFlight);
            setViewingFlight(null);
          }}
        />
      )}
      {viewingStay && (
        <StayDetailView
          stay={viewingStay}
          trip={trip}
          updateTrip={updateTrip}
          onClose={() => setViewingStay(null)}
          onEdit={() => {
            setEditingStay(viewingStay);
            setViewingStay(null);
          }}
        />
      )}
      {viewingBooking && (
        <BookingItemDetailView
          item={viewingBooking}
          trip={trip}
          updateTrip={updateTrip}
          onClose={() => setViewingBooking(null)}
          onEdit={() => {
            setEditingBooking(viewingBooking);
            setViewingBooking(null);
          }}
        />
      )}

      {editingFlight && (
        <FlightForm
          trip={trip}
          updateTrip={updateTrip}
          initial={editingFlight}
          onClose={() => setEditingFlight(null)}
          onSave={(f) => saveFlight(f)}
          onDelete={() =>
            setPendingDelete({
              kind: 'flight',
              id: editingFlight.id,
              name: `${editingFlight.airline} ${editingFlight.flightNumber}`,
              relatedTo: flightRelatedTo(editingFlight),
            })
          }
        />
      )}
      {editingStay && (
        <StayForm
          trip={trip}
          updateTrip={updateTrip}
          initial={editingStay}
          existingStays={trip.stays}
          recentLocations={trip.rememberedLocations}
          onClose={() => setEditingStay(null)}
          onSave={(s) => saveStay(s)}
          onDelete={() => setPendingDelete({ kind: 'stay', id: editingStay.id, name: editingStay.name, relatedTo: stayRelatedTo(editingStay) })}
        />
      )}
      {editingBooking && (
        <BookingItemForm
          type={editingBooking.type}
          trip={trip}
          updateTrip={updateTrip}
          initial={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSave={(item, addToItinerary) => saveBooking(item, addToItinerary)}
          onDelete={() =>
            setPendingDelete({ kind: 'booking', id: editingBooking.id, name: editingBooking.name, relatedTo: bookingItemRelatedTo(editingBooking) })
          }
        />
      )}

      {pendingDelete && <DeleteConfirmSheet itemName={pendingDelete.name} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} />}
    </div>
  );
}
