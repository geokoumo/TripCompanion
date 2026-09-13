import { Suspense, useState } from 'react';
import { DocumentsListScreenLazy } from '../../../app/lazyScreens';
import { ScreenLoadingFallback } from '../../../app/ScreenLoadingFallback';
import { BOOKING_ITEM_TYPES, type BookingItemTypeId } from '../../../config/constants';
import { BedIcon, FileIcon, ListIcon, PlaneIcon } from '../../../shared/components/icons';
import { StampToggle } from '../../../shared/components/StampToggle';
import { AddToTripSheet } from '../../bookings/components/AddToTripSheet';
import { BookingItemsListScreen } from '../../bookings/components/BookingItemsListScreen';
import { BookingsHub } from '../../bookings/components/BookingsHub';
import { BOOKING_TYPE_ICON, type AddToTripDestination } from '../../bookings/lib/bookingGridConfig';
import { FlightsTab } from '../../flights/components/FlightsTab';
import { StaysTab } from '../../stays/components/StaysTab';
import type { Trip, TripTab } from '../types';
import type { useTrip } from '../hooks/useTrip';
import styles from './BookingsTab.module.css';

type SubView = 'all' | AddToTripDestination;

interface BookingsTabProps {
  trip: Trip;
  activeTab: Extract<TripTab, 'flights' | 'stays'>;
  onTabChange: (tab: TripTab) => void;
  updateTrip: ReturnType<typeof useTrip>['updateTrip'];
}

const SWITCHER_ITEMS: { id: SubView; label: string; Icon: typeof PlaneIcon }[] = [
  { id: 'all', label: 'All', Icon: ListIcon },
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
 *
 * "All" is the default landing view: a unified, chronological feed across
 * flights/stays/booking items (BookingsHub) so the tab reads as one
 * connected set of bookings instead of leading with a single type. The
 * per-type pills still exist for focused management of just one type.
 */
export function BookingsTab({ trip, activeTab, onTabChange, updateTrip }: BookingsTabProps) {
  // 'flights' is also the generic default the bottom nav's "Bookings" button
  // always navigates to, so it can't signal real intent to land on Flights
  // specifically — treat it as "just entered Bookings" and show the unified
  // feed. 'stays' has no such generic path (only an explicit deep link, e.g.
  // a Trip Health "add a stay" action or a shared/refreshed URL), so honor it.
  const [subView, setSubView] = useState<SubView>(activeTab === 'stays' ? 'stays' : 'all');
  const [pickerOpen, setPickerOpen] = useState(false);

  const select = (view: SubView) => {
    setSubView(view);
    if (view === 'flights' || view === 'stays') onTabChange(view);
  };

  return (
    <div>
      <div className={styles.switcherRow}>
        <div className={styles.switcherScroll}>
          <StampToggle options={SWITCHER_ITEMS} value={subView} onChange={select} variant="plain" layout="scroll" />
        </div>
        <button type="button" className={styles.moreButton} onClick={() => setPickerOpen(true)} aria-label="Add to trip">
          +
        </button>
      </div>

      {subView === 'all' && <BookingsHub trip={trip} updateTrip={updateTrip} />}
      {subView === 'flights' && <FlightsTab trip={trip} updateTrip={updateTrip} />}
      {subView === 'stays' && <StaysTab trip={trip} updateTrip={updateTrip} />}
      {subView === 'documents' && (
        <Suspense fallback={<ScreenLoadingFallback />}>
          <DocumentsListScreenLazy trip={trip} updateTrip={updateTrip} />
        </Suspense>
      )}
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
