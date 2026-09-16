import { Suspense, useState } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { CreateTripWizardLazy } from '../../../app/lazyScreens';
import { LoadingScreen } from '../../../app/LoadingScreen';
import { ScreenLoadingFallback } from '../../../app/ScreenLoadingFallback';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { ErrorState } from '../../../shared/components/ErrorState';
import { TripHealthScreen } from '../../tripHealth/components/TripHealthScreen';
import { OverviewTab } from './OverviewTab';
import { BookingsTab } from './BookingsTab';
import { ItineraryTab } from '../../itinerary/components/ItineraryTab';
import { BudgetTab } from '../../budget/components/BudgetTab';
import { ChecklistTab } from '../../checklist/components/ChecklistTab';
import { useTrip } from '../hooks/useTrip';
import type { Trip, TripTab } from '../types';
import { InTripBottomNav } from './InTripBottomNav';
import { TripHeader } from './TripHeader';
import styles from './TripDetailScreen.module.css';

interface TripDetailScreenProps {
  tripId: string;
  activeTab: TripTab;
  onTabChange: (tab: TripTab) => void;
  onBack: () => void;
}

export function TripDetailScreen({ tripId, activeTab, onTabChange, onBack }: TripDetailScreenProps) {
  const { trip, loading, updateTrip, saveTrip } = useTrip(tripId);
  const { deleteTrip } = useTripsContext();
  const { showToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
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
            onArchiveToggle={() => void saveTrip({ ...trip, archived: !trip.archived })}
            onDuplicate={() => setDuplicating(true)}
            onDeleteRequest={() => setConfirmDelete(true)}
            onSaveTrip={(updated) => saveTrip(updated)}
            hideDates={activeTab === 'overview'}
          />
          <div className={styles.content}>
            {activeTab === 'overview' && <OverviewTab trip={trip} updateTrip={updateTrip} onOpenTripHealth={() => setShowTripHealth(true)} />}
            {(activeTab === 'flights' || activeTab === 'stays') && (
              <BookingsTab trip={trip} activeTab={activeTab} onTabChange={onTabChange} updateTrip={updateTrip} />
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

      {duplicating && (
        <Suspense fallback={<ScreenLoadingFallback />}>
          <CreateTripWizardLazy
            onClose={() => setDuplicating(false)}
            onCreated={() => {
              setDuplicating(false);
              onBack();
            }}
            duplicateSeed={{
              categories: trip.budgetCategories,
              checklistTemplateItems: trip.checklistItems
                .filter((i) => i.travelerId === trip.travelers[0]?.id)
                .map(({ text, category, quantity }) => ({ text, category, quantity })),
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
