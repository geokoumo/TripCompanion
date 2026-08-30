import { useState } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { LoadingScreen } from '../../../app/LoadingScreen';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { OverviewTab } from './OverviewTab';
import { FlightsTab } from '../../flights/components/FlightsTab';
import { StaysTab } from '../../stays/components/StaysTab';
import { ItineraryTab } from '../../itinerary/components/ItineraryTab';
import { BudgetTab } from '../../budget/components/BudgetTab';
import { ChecklistTab } from '../../checklist/components/ChecklistTab';
import { useTrip } from '../hooks/useTrip';
import type { Trip, TripTab } from '../types';
import { CreateTripWizard } from './CreateTripWizard';
import { TripHeader } from './TripHeader';

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

  if (loading) {
    return <LoadingScreen />;
  }

  if (!trip) {
    return <div style={{ padding: 32 }}>Το ταξίδι δεν βρέθηκε.</div>;
  }

  const confirmDeleteTrip = () => {
    const snapshot: Trip = trip;
    void deleteTrip(trip.id);
    setConfirmDelete(false);
    onBack();
    showToast('Διαγράφηκε.', {
      variant: 'neutral',
      action: { label: 'Αναίρεση', onClick: () => void saveTrip(snapshot) },
    });
  };

  return (
    <div style={{ paddingBottom: 64 }}>
      <TripHeader
        trip={trip}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onBack={onBack}
        onArchiveToggle={() => void saveTrip({ ...trip, archived: !trip.archived })}
        onDuplicate={() => setDuplicating(true)}
        onDeleteRequest={() => setConfirmDelete(true)}
        onSaveTrip={(updated) => void saveTrip(updated)}
      />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px' }}>
        {activeTab === 'overview' && <OverviewTab trip={trip} />}
        {activeTab === 'flights' && <FlightsTab trip={trip} updateTrip={updateTrip} />}
        {activeTab === 'stays' && <StaysTab trip={trip} updateTrip={updateTrip} />}
        {activeTab === 'itinerary' && <ItineraryTab trip={trip} updateTrip={updateTrip} />}
        {activeTab === 'budget' && <BudgetTab trip={trip} updateTrip={updateTrip} />}
        {activeTab === 'checklist' && <ChecklistTab trip={trip} updateTrip={updateTrip} />}
      </div>

      {confirmDelete && (
        <DeleteConfirmSheet itemName={trip.title} onCancel={() => setConfirmDelete(false)} onConfirm={confirmDeleteTrip} />
      )}

      {duplicating && (
        <CreateTripWizard
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
      )}
    </div>
  );
}
