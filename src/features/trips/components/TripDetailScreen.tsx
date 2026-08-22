import { useState } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { OverviewTab } from './OverviewTab';
import { FlightsTab } from '../../flights/components/FlightsTab';
import { StaysTab } from '../../stays/components/StaysTab';
import { ItineraryTab } from '../../itinerary/components/ItineraryTab';
import { BudgetTab } from '../../budget/components/BudgetTab';
import { ChecklistTab } from '../../checklist/components/ChecklistTab';
import { useTrip } from '../hooks/useTrip';
import type { TripTab } from '../types';
import { TripHeader } from './TripHeader';

interface TripDetailScreenProps {
  tripId: string;
  activeTab: TripTab;
  onTabChange: (tab: TripTab) => void;
  onBack: () => void;
}

export function TripDetailScreen({ tripId, activeTab, onTabChange, onBack }: TripDetailScreenProps) {
  const { trip, updateTrip, saveTrip } = useTrip(tripId);
  const { deleteTrip } = useTripsContext();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!trip) {
    return <div style={{ padding: 32 }}>Το ταξίδι δεν βρέθηκε.</div>;
  }

  return (
    <div style={{ paddingBottom: 64 }}>
      <TripHeader
        trip={trip}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onBack={onBack}
        onArchiveToggle={() => void saveTrip({ ...trip, archived: !trip.archived })}
        onDelete={() => setConfirmDelete(true)}
      />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px' }}>
        {activeTab === 'overview' && <OverviewTab trip={trip} onTabChange={onTabChange} />}
        {activeTab === 'flights' && <FlightsTab trip={trip} updateTrip={updateTrip} />}
        {activeTab === 'stays' && <StaysTab trip={trip} updateTrip={updateTrip} />}
        {activeTab === 'itinerary' && <ItineraryTab trip={trip} updateTrip={updateTrip} />}
        {activeTab === 'budget' && <BudgetTab trip={trip} updateTrip={updateTrip} />}
        {activeTab === 'checklist' && <ChecklistTab trip={trip} updateTrip={updateTrip} />}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Διαγραφή ταξιδιού"
          message={`Θα διαγραφεί μόνιμα το ταξίδι "${trip.title}". Η ενέργεια δεν αναιρείται.`}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            void deleteTrip(trip.id);
            onBack();
          }}
        />
      )}
    </div>
  );
}
