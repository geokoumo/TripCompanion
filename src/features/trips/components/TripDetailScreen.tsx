import { useState } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { LoadingScreen } from '../../../app/LoadingScreen';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { ErrorState } from '../../../shared/components/ErrorState';
import { TripHealthScreen } from '../../tripHealth/components/TripHealthScreen';
import { OverviewTab } from './OverviewTab';
import { BookingsTab } from './BookingsTab';
import { ItineraryTab } from '../../itinerary/components/ItineraryTab';
import { BudgetTab } from '../../budget/components/BudgetTab';
import { ChecklistTab } from '../../checklist/components/ChecklistTab';
import { useTrip } from '../hooks/useTrip';
import { cloneTripForDuplication } from '../lib/cloneTripForDuplication';
import { saveTripPatch } from '../lib/saveTripPatch';
import type { Trip, TripTab } from '../types';
import type { AddToTripDestination } from '../../bookings/lib/bookingGridConfig';
import { InTripBottomNav } from './InTripBottomNav';
import { TripHeader } from './TripHeader';
import styles from './TripDetailScreen.module.css';

interface TripDetailScreenProps {
  tripId: string;
  activeTab: TripTab;
  onTabChange: (tab: TripTab) => void;
  onBack: () => void;
  // Called with the new trip's id right after a successful "Duplicate trip"
  // — the caller owns global navigation, so it decides where that lands
  // (currently: straight into the new trip, the same established behavior
  // as creating any other new trip).
  onDuplicated: (newTripId: string) => void;
  // Passed through from the app shell's global Add Hub (BottomNav's "+") so
  // BookingsTab can land straight on the chosen destination — see that
  // prop's doc comment on BookingsTab for why it's consumed via an effect.
  pendingBookingSubView?: AddToTripDestination | null;
  onConsumePendingBookingSubView?: () => void;
}

export function TripDetailScreen({
  tripId,
  activeTab,
  onTabChange,
  onBack,
  onDuplicated,
  pendingBookingSubView,
  onConsumePendingBookingSubView,
}: TripDetailScreenProps) {
  const { trip, loading, updateTrip, saveTrip } = useTrip(tripId);
  const { deleteTrip, saveTrip: saveTripToContext, getFullTripOrThrow } = useTripsContext();
  const { showToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showTripHealth, setShowTripHealth] = useState(false);
  // Lifted out of ItineraryTab so the selected day survives switching to
  // another in-trip tab and back — ItineraryTab itself unmounts on every
  // tab switch (see the conditional render below), which would otherwise
  // reset it to today/day one each time.
  const [itinerarySelectedDate, setItinerarySelectedDate] = useState<string | null>(null);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!trip) {
    // Same message whether the trip genuinely doesn't exist or it belongs to
    // someone else — never confirm-or-deny another account's trip by id.
    return (
      <div style={{ padding: 32 }}>
        <ErrorState headline="Trip not found" body="This trip doesn't exist, or isn't yours to view." onRetry={onBack} retryLabel="Back to trips" />
      </div>
    );
  }

  const confirmDeleteTrip = () => {
    const snapshot: Trip = trip;
    void deleteTrip(trip.id);
    setConfirmDelete(false);
    onBack();
    showToast('Deleted.', {
      variant: 'neutral',
      action: { label: 'Undo', onClick: () => void saveTrip(snapshot) },
    });
  };

  const duplicateTrip = async () => {
    const clone = cloneTripForDuplication(trip);
    try {
      await saveTripToContext(clone);
      showToast(`Duplicated as "${clone.title}".`);
      onDuplicated(clone.id);
    } catch {
      // saveTrip already surfaces its own failure toast
    }
  };

  return (
    <div style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
      {showTripHealth ? (
        <TripHealthScreen
          trip={trip}
          onBack={() => setShowTripHealth(false)}
          onNavigate={(target) => {
            setShowTripHealth(false);
            onTabChange(target);
          }}
        />
      ) : (
        <>
          <TripHeader
            trip={trip}
            onBack={onBack}
            onArchiveToggle={() => void saveTripPatch(trip.id, (fresh) => ({ archived: !fresh.archived }), getFullTripOrThrow, saveTrip)}
            onDuplicate={() => void duplicateTrip()}
            onDeleteRequest={() => setConfirmDelete(true)}
            onSaveTrip={(updated) => saveTrip(updated)}
            hideDates={activeTab === 'overview'}
          />
          <div className={styles.content}>
            {activeTab === 'overview' && <OverviewTab trip={trip} updateTrip={updateTrip} onOpenTripHealth={() => setShowTripHealth(true)} />}
            {(activeTab === 'flights' || activeTab === 'stays') && (
              <BookingsTab
                trip={trip}
                activeTab={activeTab}
                onTabChange={onTabChange}
                updateTrip={updateTrip}
                pendingSubView={pendingBookingSubView}
                onConsumePendingSubView={onConsumePendingBookingSubView}
              />
            )}
            {activeTab === 'itinerary' && (
              <ItineraryTab
                trip={trip}
                updateTrip={updateTrip}
                selectedDate={itinerarySelectedDate}
                onSelectedDateChange={setItinerarySelectedDate}
              />
            )}
            {activeTab === 'budget' && <BudgetTab trip={trip} updateTrip={updateTrip} />}
            {activeTab === 'checklist' && <ChecklistTab trip={trip} updateTrip={updateTrip} />}
          </div>
        </>
      )}

      <InTripBottomNav activeTab={activeTab} onTabChange={onTabChange} />

      {confirmDelete && (
        <DeleteConfirmSheet itemName={trip.title} onCancel={() => setConfirmDelete(false)} onConfirm={confirmDeleteTrip} />
      )}
    </div>
  );
}
