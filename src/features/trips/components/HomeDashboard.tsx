import { Suspense, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { ShareSheetLazy } from '../../../app/lazyScreens';
import { ScreenLoadingFallback } from '../../../app/ScreenLoadingFallback';
import { deleteTripFile, isLocalDataUrl, readAsDataUrl, uploadTripFile, validateTripFile } from '../../../data/storage/tripFilesBucket';
import { getOwnProfile } from '../../../data/repository/profileRepository';
import { AvatarRow } from '../../../shared/components/AvatarChip';
import { EmptyState } from '../../../shared/components/EmptyState';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { BellIcon, GearIcon } from '../../../shared/components/icons';
import { ManageTravelersSheet } from '../../travelers/components/ManageTravelersSheet';
import { EditDescriptionSheet } from './EditDescriptionSheet';
import { TripMenuSheet } from './TripMenuSheet';
import { FutureDestinationCard } from './FutureDestinationCard';
import { downloadTripAsJson } from '../lib/tripFile';
import { daysBetween, formatDateShort, nowTimeStr, todayStr } from '../../../shared/lib/dateFormat';
import { buildTripMoments, formatRelativeMinutes, getCurrentAndNextMoment, minutesUntilMoment } from '../lib/timeline';
import { getActiveOrNextTrip } from '../lib/activeTrip';
import { cloneTripForDuplication } from '../lib/cloneTripForDuplication';
import { destinationLabel } from '../lib/summary';
import { getTripStatus, type Trip, type TripListItem, type TripTab } from '../types';
import { useCoverPhotoUrl } from '../lib/useCoverPhotoUrl';
import styles from './HomeDashboard.module.css';

interface HomeDashboardProps {
  onOpenTrip: (tripId: string, tab?: TripTab) => void;
  onSeeAllTrips: () => void;
  onCreateTrip: () => void;
  onOpenSettings: () => void;
}

/** "{Destination} in N Days" while upcoming, "Day X of Y" while ongoing/today — the hero's countdown pill. */
function countdownLabel(trip: TripListItem, dest: string): string | null {
  if (!trip.startDate || !trip.endDate) return null;
  const range = { startDate: trip.startDate, endDate: trip.endDate };
  const status = getTripStatus(range);
  if (status === 'upcoming') {
    const days = daysBetween(todayStr(), range.startDate);
    if (days <= 0) return dest ? `${dest} today` : 'Today';
    return dest ? `${dest} in ${days} Day${days === 1 ? '' : 's'}` : `In ${days} day${days === 1 ? '' : 's'}`;
  }
  const totalDays = daysBetween(range.startDate, range.endDate) + 1;
  const currentDay = Math.min(Math.max(daysBetween(range.startDate, todayStr()) + 1, 1), totalDays);
  return `Day ${currentDay} of ${totalDays}`;
}

/**
 * The Design 2.0 "Home" destination — distinct from the full Trips list:
 * a personal dashboard for whichever trip is active right now, or soonest
 * upcoming, plus what's next on it and a peek at other future trips.
 * Everything else (browsing every trip, archived trips, import) lives on
 * the Trips screen instead.
 */
export function HomeDashboard({ onOpenTrip, onSeeAllTrips, onCreateTrip, onOpenSettings }: HomeDashboardProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { trips, loading, saveTrip, deleteTrip, getFullTrip } = useTripsContext();
  const [fullTrip, setFullTrip] = useState<Trip | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editDescriptionOpen, setEditDescriptionOpen] = useState(false);
  const [manageTravelersOpen, setManageTravelersOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);

  const active = getActiveOrNextTrip(trips);
  const heroPhotoUrl = useCoverPhotoUrl(active?.coverPhotoPath);

  useEffect(() => {
    setFullTrip(null);
    if (!active) return;
    let cancelled = false;
    void getFullTrip(active.id).then((t) => {
      if (!cancelled) setFullTrip(t);
    });
    return () => {
      cancelled = true;
    };
  }, [active?.id, getFullTrip]);

  useEffect(() => {
    if (!user) {
      setProfileName(null);
      return;
    }
    void getOwnProfile().then((profile) => setProfileName(profile?.displayName ?? null));
  }, [user]);

  const metadataName = typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name : undefined;
  const firstName = (profileName ?? metadataName)?.trim().split(/\s+/)[0];
  const identityInitial = (firstName ?? user?.email)?.charAt(0).toUpperCase();

  const handleCoverPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !fullTrip) return;
    const validationError = validateTripFile(file);
    if (validationError) {
      showToast(validationError, { variant: 'error' });
      return;
    }
    try {
      const newPath = user ? await uploadTripFile(user.id, fullTrip.id, file) : await readAsDataUrl(file);
      const oldPath = fullTrip.coverPhotoPath;
      await saveTrip({ ...fullTrip, coverPhotoPath: newPath });
      if (oldPath && !isLocalDataUrl(oldPath)) void deleteTripFile(oldPath);
      showToast('Cover photo updated.');
    } catch {
      showToast('Upload failed. Try again.', { variant: 'error' });
    }
  };

  const duplicateTrip = async (source: Trip) => {
    const clone = cloneTripForDuplication(source);
    try {
      await saveTrip(clone);
      showToast(`Duplicated as "${clone.title}".`);
      onOpenTrip(clone.id);
    } catch {
      // saveTrip already surfaces its own failure toast
    }
  };

  if (loading) {
    return (
      <div className={styles.screen}>
        <div className={styles.header}>
          <div>
            <div className={styles.greeting}>{firstName ? `Hello ${firstName}` : 'Hello'}</div>
            <div className={styles.tagline}>Your travel operating system is ready.</div>
          </div>
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className={styles.screen}>
        <div className={styles.header}>
          <div>
            <div className={styles.greeting}>{firstName ? `Hello ${firstName}` : 'Hello'}</div>
            <div className={styles.tagline}>Your travel operating system is ready.</div>
          </div>
          <button type="button" className={styles.avatarButton} onClick={onOpenSettings} aria-label="Settings">
            {identityInitial ?? <GearIcon size={18} />}
          </button>
        </div>
        <EmptyState headline="No trips yet" body="Plan your next trip to see it here." action={{ label: 'Create a trip', onClick: onCreateTrip }} />
      </div>
    );
  }

  const dest = destinationLabel(active.cities);
  const countdown = countdownLabel(active, dest);
  const range = active.startDate && active.endDate ? { startDate: active.startDate, endDate: active.endDate } : null;

  const moments = fullTrip ? buildTripMoments(fullTrip.flights, fullTrip.stays, fullTrip.itineraryStops) : [];
  const { current, next } = getCurrentAndNextMoment(moments, todayStr(), nowTimeStr());
  const upNext = current ?? next;

  const futureDestinations = trips
    .filter((t) => !t.archived && t.id !== active.id && t.startDate && t.startDate > todayStr())
    .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div>
          <div className={styles.greeting}>{firstName ? `Hello ${firstName}` : 'Hello'}</div>
          <div className={styles.tagline}>Your travel operating system is ready.</div>
        </div>
        <button type="button" className={styles.avatarButton} onClick={onOpenSettings} aria-label="Settings">
          {identityInitial ?? <GearIcon size={18} />}
        </button>
      </div>

      {/* A real <button> can't contain the menu button's own nested button —
          same nestedInteractive pattern as shared/components/Card.tsx: a
          role="button" div as the outer interactive element instead. */}
      <div
        role="button"
        tabIndex={0}
        className={styles.hero}
        onClick={() => onOpenTrip(active.id)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenTrip(active.id);
          }
        }}
        style={heroPhotoUrl ? { backgroundImage: `url(${heroPhotoUrl})` } : undefined}
      >
        {!heroPhotoUrl && <div className={styles.heroPlaceholder} aria-hidden="true" />}
        <div className={styles.heroOverlay} />
        <button
          type="button"
          className={styles.heroMenuButton}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(true);
          }}
          aria-label="Trip options"
        >
          ···
        </button>
        <div className={styles.heroContent}>
          {countdown && <div className={styles.countdownPill}>{countdown.toUpperCase()}</div>}
          {active.travelers.length > 0 && (
            <div className={styles.heroAvatars}>
              <AvatarRow travelers={active.travelers} />
            </div>
          )}
          <div className={styles.heroDestination}>{dest || active.title}</div>
          {range && (
            <div className={styles.heroDates}>
              {formatDateShort(range.startDate)} – {formatDateShort(range.endDate)}
            </div>
          )}
        </div>
      </div>

      {upNext && (
        <button type="button" className={styles.activityRow} onClick={() => onOpenTrip(active.id, 'itinerary')}>
          <span className={styles.activityIcon}>
            <BellIcon size={18} />
          </span>
          <span className={styles.activityMain}>
            <span className={styles.activityLabel}>{current ? 'Happening now' : 'Next important activity'}</span>
            <span className={styles.activityTitle}>{upNext.title}</span>
            <span className={styles.activityMeta}>
              {formatRelativeMinutes(minutesUntilMoment(upNext, todayStr(), nowTimeStr()))}
              {upNext.subtitle ? ` · ${upNext.subtitle}` : ''}
            </span>
          </span>
          <span className={styles.activityChevron} aria-hidden="true">
            ›
          </span>
        </button>
      )}

      {futureDestinations.length > 0 && (
        <div className={styles.futureSection}>
          <div className={styles.futureSectionHeader}>
            <span className={styles.sectionTitle}>Future Destinations</span>
            <button type="button" className={styles.seeAllLink} onClick={onSeeAllTrips}>
              See All
            </button>
          </div>
          <div className={styles.futureScroll}>
            {futureDestinations.map((trip) => (
              <FutureDestinationCard key={trip.id} trip={trip} onOpen={() => onOpenTrip(trip.id)} />
            ))}
          </div>
        </div>
      )}

      {menuOpen && fullTrip && (
        <TripMenuSheet
          trip={fullTrip}
          onClose={() => setMenuOpen(false)}
          onShare={() => setShareOpen(true)}
          onDuplicate={() => void duplicateTrip(fullTrip)}
          onExport={() => downloadTripAsJson(fullTrip)}
          onEditDescription={() => setEditDescriptionOpen(true)}
          onChangeCoverPhoto={() => coverPhotoInputRef.current?.click()}
          onManageTravelers={() => setManageTravelersOpen(true)}
          onArchiveToggle={() => void saveTrip({ ...fullTrip, archived: !fullTrip.archived })}
          onDelete={() => setConfirmDelete(true)}
        />
      )}

      {manageTravelersOpen && fullTrip && (
        <ManageTravelersSheet trip={fullTrip} onClose={() => setManageTravelersOpen(false)} onSave={(updated) => saveTrip(updated)} />
      )}

      {editDescriptionOpen && fullTrip && (
        <EditDescriptionSheet trip={fullTrip} onClose={() => setEditDescriptionOpen(false)} onSave={(updated) => saveTrip(updated)} />
      )}

      {shareOpen && fullTrip && (
        <Suspense fallback={<ScreenLoadingFallback />}>
          <ShareSheetLazy trip={fullTrip} onClose={() => setShareOpen(false)} onSave={(updated) => void saveTrip(updated)} />
        </Suspense>
      )}

      {confirmDelete && fullTrip && (
        <DeleteConfirmSheet
          itemName={fullTrip.title}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            void deleteTrip(fullTrip.id);
            setConfirmDelete(false);
            onSeeAllTrips();
          }}
        />
      )}

      <input ref={coverPhotoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => void handleCoverPhotoFile(e)} />
    </div>
  );
}
