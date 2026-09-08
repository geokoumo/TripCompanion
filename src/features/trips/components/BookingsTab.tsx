import { useState } from 'react';
import { BOOKING_ITEM_TYPES, type BookingItemTypeId } from '../../../config/constants';
import { BedIcon, FileIcon, PlaneIcon } from '../../../shared/components/icons';
import { AddToTripSheet } from '../../bookings/components/AddToTripSheet';
import { BookingItemsListScreen } from '../../bookings/components/BookingItemsListScreen';
import { BOOKING_TYPE_ICON, type AddToTripDestination } from '../../bookings/lib/bookingGridConfig';
import { DocumentsListScreen } from '../../documents/components/DocumentsListScreen';
import { FlightsTab } from '../../flights/components/FlightsTab';
import { StaysTab } from '../../stays/components/StaysTab';
import type { Trip, TripTab } from '../types';
import type { useTrip } from '../hooks/useTrip';
import styles from './BookingsTab.module.css';

type SubView = AddToTripDestination;

interface BookingsTabProps {
  trip: Trip;
  activeTab: Extract<TripTab, 'flights' | 'stays'>;
  onTabChange: (tab: TripTab) => void;
  updateTrip: ReturnType<typeof useTrip>['updateTrip'];
}

const SWITCHER_ITEMS: { id: SubView; label: string; Icon: typeof PlaneIcon }[] = [
  { id: 'flights', label: 'Flights', Icon: PlaneIcon },
  { id: 'stays', label: 'Stays', Icon: BedIcon },
  ...BOOKING_ITEM_TYPES.map((t) => ({ id: t.id, label: t.label, Icon: BOOKING_TYPE_ICON[t.id].Icon })),
  { id: 'documents', label: 'Documents', Icon: FileIcon },
];

const BOOKING_TYPE_IDS = new Set<string>(BOOKING_ITEM_TYPES.map((t) => t.id));

/**
 * "Bookings" merged Flights and Stays behind a segmented control; Round 11
 * grows that same slot into a scrollable type switcher covering every
 * booking type plus Documents, and adds the "Add to trip" picker (the "+")
 * as a second way to jump straight into adding one. The URL/route tab still
 * only ever tracks 'flights'/'stays' — every other sub-view is local UI
 * state, same reasoning as before: sharing and quick actions for those two
 * keep working unchanged, and the new types don't need deep-linking yet.
 */
export function BookingsTab({ trip, activeTab, onTabChange, updateTrip }: BookingsTabProps) {
  const [subView, setSubView] = useState<SubView>(activeTab);
  const [pickerOpen, setPickerOpen] = useState(false);

  const select = (view: SubView) => {
    setSubView(view);
    if (view === 'flights' || view === 'stays') onTabChange(view);
  };

  return (
    <div>
      <div className={styles.switcherRow}>
        <div className={styles.switcherScroll}>
          {SWITCHER_ITEMS.map(({ id, label, Icon }) => (
            <button key={id} type="button" className={styles.switcherPill} data-active={subView === id} onClick={() => select(id)}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
        <button type="button" className={styles.moreButton} onClick={() => setPickerOpen(true)} aria-label="Add to trip">
          +
        </button>
      </div>

      {subView === 'flights' && <FlightsTab trip={trip} updateTrip={updateTrip} />}
      {subView === 'stays' && <StaysTab trip={trip} updateTrip={updateTrip} />}
      {subView === 'documents' && <DocumentsListScreen trip={trip} updateTrip={updateTrip} />}
      {BOOKING_TYPE_IDS.has(subView) && <BookingItemsListScreen type={subView as BookingItemTypeId} trip={trip} updateTrip={updateTrip} />}

      {pickerOpen && (
        <AddToTripSheet
          onClose={() => setPickerOpen(false)}
          onSelect={(destination) => {
            select(destination);
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
