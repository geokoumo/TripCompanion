import { useAuth } from './providers/AuthProvider';
import { GearIcon, HomeIcon, SearchIcon } from '../shared/components/icons';
import { IN_TRIP_NAV_ITEMS, isInTripNavActive } from '../features/trips/components/InTripBottomNav';
import type { TripTab } from '../features/trips/types';
import type { TopLevelTab } from '../shared/lib/useHashRoute';
import styles from './Sidebar.module.css';

interface SidebarTripContext {
  activeTab: TripTab;
  onTabChange: (tab: TripTab) => void;
}

interface SidebarProps {
  active: TopLevelTab;
  onNavigate: (tab: TopLevelTab) => void;
  onCreateTrip: () => void;
  settingsActive: boolean;
  onSettingsTap: () => void;
  /** Present only while route.name === 'trip' — adds the same 5 in-trip destinations InTripBottomNav shows on mobile, so desktop never loses that navigation, just relocates it. */
  trip?: SidebarTripContext | null;
}

/**
 * Desktop-only left navigation (see the @media min-width: 1024px rules in
 * BottomNav.module.css / InTripBottomNav.module.css that hide their mobile
 * bar counterparts at this width). Deliberately mirrors the *existing*
 * global routes — Home / Search / Settings — rather than the standalone
 * "Trips"/"Itinerary" items sometimes sketched in wide-screen mockups: this
 * app has no global "current trip" concept outside of actually being on a
 * trip's own route, so a trip's sections only ever appear here once you're
 * on that trip (mirroring InTripBottomNav below).
 */
export function Sidebar({ active, onNavigate, onCreateTrip, settingsActive, onSettingsTap, trip }: SidebarProps) {
  const { user, enabled } = useAuth();
  const identity = user?.email ?? (enabled ? null : 'This device');

  return (
    <nav className={styles.sidebar} aria-label="Primary">
      <div className={styles.brand}>
        <span className={styles.mark}>T</span>
        TripCompanion
      </div>

      <button type="button" className={styles.newTrip} onClick={onCreateTrip}>
        + New Trip
      </button>

      <div className={styles.section}>
        <button type="button" className={styles.item} data-active={active === 'home' && !trip} onClick={() => onNavigate('home')}>
          <HomeIcon size={18} />
          Home
        </button>
        <button type="button" className={styles.item} data-active={active === 'search'} onClick={() => onNavigate('search')}>
          <SearchIcon size={18} />
          Search
        </button>
        <button type="button" className={styles.item} data-active={settingsActive} onClick={onSettingsTap}>
          <GearIcon size={18} />
          Settings
        </button>
      </div>

      {trip && (
        <>
          <div className={styles.sectionLabel}>This trip</div>
          <div className={styles.section}>
            {IN_TRIP_NAV_ITEMS.map(({ key, label, Icon, navigateTab }) => (
              <button
                key={key}
                type="button"
                className={styles.item}
                data-active={isInTripNavActive(key, trip.activeTab)}
                onClick={() => trip.onTabChange(navigateTab)}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {identity && (
        <div className={styles.footer}>
          <span className={styles.footerAvatar}>{identity.charAt(0).toUpperCase()}</span>
          <span className={styles.footerLabel}>{identity}</span>
        </div>
      )}
    </nav>
  );
}
