import { FlightsTab } from '../../flights/components/FlightsTab';
import { StaysTab } from '../../stays/components/StaysTab';
import type { Trip, TripTab } from '../types';
import type { useTrip } from '../hooks/useTrip';
import styles from './BookingsTab.module.css';

interface BookingsTabProps {
  trip: Trip;
  activeTab: Extract<TripTab, 'flights' | 'stays'>;
  onTabChange: (tab: TripTab) => void;
  updateTrip: ReturnType<typeof useTrip>['updateTrip'];
}

/** "Bookings" merges Flights and Stays behind a segmented control — the URL/route
 * tab still tracks the real sub-tab (flights/stays), so sharing and quick actions
 * keep working unchanged; this is purely a navigation grouping. */
export function BookingsTab({ trip, activeTab, onTabChange, updateTrip }: BookingsTabProps) {
  return (
    <div>
      <div className={styles.segmented}>
        <button type="button" className={styles.segment} data-active={activeTab === 'flights'} onClick={() => onTabChange('flights')}>
          Πτήσεις
        </button>
        <button type="button" className={styles.segment} data-active={activeTab === 'stays'} onClick={() => onTabChange('stays')}>
          Διαμονή
        </button>
      </div>
      {activeTab === 'flights' ? <FlightsTab trip={trip} updateTrip={updateTrip} /> : <StaysTab trip={trip} updateTrip={updateTrip} />}
    </div>
  );
}
