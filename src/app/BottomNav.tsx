import { DotsCircleIcon, HomeIcon, ListIcon, SuitcaseIcon } from '../shared/components/icons';
import { getActiveOrNextTrip } from '../features/trips/lib/activeTrip';
import { useTripsContext } from './providers/TripsProvider';
import type { Route, TopLevelTab } from '../shared/lib/useHashRoute';
import styles from './BottomNav.module.css';

interface BottomNavProps {
  active: TopLevelTab;
  onNavigate: (route: Route) => void;
  onAddTap: () => void;
}

/**
 * App-shell-level primary navigation: Home / Trips / Add / Itinerary / More
 * (the approved Design 2.0 mobile nav) — unrelated to the in-trip tab bar
 * (Overview/Itinerary/Bookings/…) InTripBottomNav renders once you're
 * actually on a trip. "Itinerary" here has no trip of its own to show
 * outside that context, so it jumps into whichever trip is active right
 * now or soonest upcoming, the same resolution Sidebar's desktop nav uses.
 * "+" opens the Add Hub (the same quick-add sheet the in-trip Bookings tab
 * uses) against that same active-or-next trip — it does not create a trip;
 * Create Trip stays reachable via Home/Trips/Sidebar's own entry points.
 */
export function BottomNav({ active, onNavigate, onAddTap }: BottomNavProps) {
  const { trips } = useTripsContext();

  const openItinerary = () => {
    const trip = getActiveOrNextTrip(trips);
    onNavigate(trip ? { name: 'trip', tripId: trip.id, tab: 'itinerary' } : { name: 'trips' });
  };

  return (
    <nav className={styles.bar}>
      <div className={styles.inner}>
        <button type="button" className={styles.item} data-active={active === 'home'} onClick={() => onNavigate({ name: 'home' })}>
          <HomeIcon size={20} />
          Home
        </button>
        <button type="button" className={styles.item} data-active={active === 'trips'} onClick={() => onNavigate({ name: 'trips' })}>
          <SuitcaseIcon size={20} />
          Trips
        </button>
        <button type="button" className={styles.createButton} onClick={onAddTap} aria-label="Add to trip">
          +
        </button>
        <button type="button" className={styles.item} onClick={openItinerary}>
          <ListIcon size={20} />
          Itinerary
        </button>
        <button type="button" className={styles.item} data-active={active === 'more' || active === 'search'} onClick={() => onNavigate({ name: 'more' })}>
          <DotsCircleIcon size={20} />
          More
        </button>
      </div>
    </nav>
  );
}
