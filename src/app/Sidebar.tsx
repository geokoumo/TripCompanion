import { useAuth } from './providers/AuthProvider';
import { useTripsContext } from './providers/TripsProvider';
import { GearIcon, HomeIcon, ListIcon, SearchIcon, SuitcaseIcon, TicketIcon } from '../shared/components/icons';
import { getActiveOrNextTrip } from '../features/trips/lib/activeTrip';
import type { Route, TopLevelTab } from '../shared/lib/useHashRoute';
import styles from './Sidebar.module.css';

interface SidebarProps {
  active: TopLevelTab;
  onNavigate: (route: Route) => void;
  onCreateTrip: () => void;
  onOpenSettings: () => void;
}

/**
 * Desktop-only left navigation (see the @media min-width: 1024px rule in
 * BottomNav.module.css that hides the mobile bar at this width). Approved
 * Design 2.0 desktop nav: Home / Trips / Itinerary / Organizer. Itinerary
 * and Organizer have no trip of their own outside an actual trip route, so
 * both jump into whichever trip is active right now or soonest upcoming
 * (falling back to Trips if there's none) — the same resolution BottomNav's
 * mobile "Itinerary" button uses. "Organizer" isn't a new merged screen:
 * it's the existing Bookings tab, which already unifies flights/stays/
 * booking items and documents behind one switcher (BookingsTab.tsx) — a
 * new screen wasn't needed to make that destination real. Search and
 * Settings remain reachable (search icon, profile row) but aren't primary
 * items, per the approved nav.
 */
export function Sidebar({ active, onNavigate, onCreateTrip, onOpenSettings }: SidebarProps) {
  const { user, enabled } = useAuth();
  const { trips } = useTripsContext();
  // Settings has real content in every one of these states (account rows
  // when signed out but accounts are configured, preferences/help always) —
  // so the footer must always offer a way in, not just when there's an
  // identity to display next to it.
  const identity = user?.email ?? (enabled ? null : 'This device');

  const goToActiveTrip = (tab: 'itinerary' | 'flights') => {
    const trip = getActiveOrNextTrip(trips);
    onNavigate(trip ? { name: 'trip', tripId: trip.id, tab } : { name: 'trips' });
  };

  return (
    <nav className={styles.sidebar} aria-label="Primary">
      <div className={styles.brandRow}>
        <div className={styles.brand}>
          <span className={styles.mark}>T</span>
          TripCompanion
        </div>
        <button type="button" className={styles.iconButton} onClick={() => onNavigate({ name: 'search' })} aria-label="Search">
          <SearchIcon size={16} />
        </button>
      </div>

      <button type="button" className={styles.newTrip} onClick={onCreateTrip}>
        + New Trip
      </button>

      <div className={styles.section}>
        <button type="button" className={styles.item} data-active={active === 'home'} onClick={() => onNavigate({ name: 'home' })}>
          <HomeIcon size={18} />
          Home
        </button>
        <button type="button" className={styles.item} data-active={active === 'trips'} onClick={() => onNavigate({ name: 'trips' })}>
          <SuitcaseIcon size={18} />
          Trips
        </button>
        <button type="button" className={styles.item} onClick={() => goToActiveTrip('itinerary')}>
          <ListIcon size={18} />
          Itinerary
        </button>
        <button type="button" className={styles.item} onClick={() => goToActiveTrip('flights')}>
          <TicketIcon size={18} />
          Organizer
        </button>
      </div>

      <button type="button" className={styles.footer} onClick={onOpenSettings}>
        {identity ? (
          <>
            <span className={styles.footerAvatar}>{identity.charAt(0).toUpperCase()}</span>
            <span className={styles.footerLabel}>{identity}</span>
          </>
        ) : (
          <span className={styles.footerLabel}>Settings</span>
        )}
        <GearIcon size={16} />
      </button>
    </nav>
  );
}
