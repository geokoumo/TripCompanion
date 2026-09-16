import { Suspense, useEffect, useState } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { CreateTripWizardLazy, ShareSheetLazy } from '../../../app/lazyScreens';
import { ScreenLoadingFallback } from '../../../app/ScreenLoadingFallback';
import { Card } from '../../../shared/components/Card';
import { EmptyState } from '../../../shared/components/EmptyState';
import { StampBadge } from '../../../shared/components/StampBadge';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { ManageTravelersSheet } from '../../travelers/components/ManageTravelersSheet';
import { EditDescriptionSheet } from './EditDescriptionSheet';
import { TripMenuSheet } from './TripMenuSheet';
import { downloadTripAsJson } from '../lib/tripFile';
import { formatDateNoYear, formatDateShort, nowTimeStr, todayStr } from '../../../shared/lib/dateFormat';
import { buildTripMoments, formatRelativeMinutes, getCurrentAndNextMoment, minutesUntilMoment } from '../lib/timeline';
import { getActiveOrNextTrip } from '../lib/activeTrip';
import { TripCard } from './TripCard';
import type { Trip, TripTab } from '../types';
import styles from './HomeDashboard.module.css';

interface HomeDashboardProps {
  onOpenTrip: (tripId: string, tab?: TripTab) => void;
  onSeeAllTrips: () => void;
  onCreateTrip: () => void;
}

/**
 * The Design 2.0 "Home" destination — distinct from the full Trips list:
 * a dashboard for whichever trip is active right now, or soonest upcoming,
 * plus what's next on it. Everything else (browsing every trip, archived
 * trips, import) lives on the Trips screen instead.
 */
export function HomeDashboard({ onOpenTrip, onSeeAllTrips, onCreateTrip }: HomeDashboardProps) {
  const { trips, loading, saveTrip, deleteTrip, getFullTrip } = useTripsContext();
  const [fullTrip, setFullTrip] = useState<Trip | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editDescriptionOpen, setEditDescriptionOpen] = useState(false);
  const [manageTravelersOpen, setManageTravelersOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  const active = getActiveOrNextTrip(trips);

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

  const todayLabel = formatDateShort(todayStr());

  if (loading) {
    return (
      <div className={styles.screen}>
        <div className={styles.topRow}>
          <div>
            <h1 className={styles.title}>Home</h1>
            <div className={styles.subtitle}>Today {todayLabel}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className={styles.screen}>
        <div className={styles.topRow}>
          <div>
            <h1 className={styles.title}>Home</h1>
            <div className={styles.subtitle}>Today {todayLabel}</div>
          </div>
        </div>
        <EmptyState headline="No trips yet" body="Plan your next trip to see it here." action={{ label: 'Create a trip', onClick: onCreateTrip }} />
      </div>
    );
  }

  const moments = fullTrip ? buildTripMoments(fullTrip.flights, fullTrip.stays, fullTrip.itineraryStops) : [];
  const { current, next } = getCurrentAndNextMoment(moments, todayStr(), nowTimeStr());
  const upNext = current ?? next;

  return (
    <div className={styles.screen}>
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Home</h1>
          <div className={styles.subtitle}>Today {todayLabel}</div>
        </div>
      </div>

      <TripCard trip={active} onOpen={() => onOpenTrip(active.id)} onOpenMenu={() => setMenuOpen(true)} />

      {upNext && (
        <Card className={styles.nextCard} onClick={() => onOpenTrip(active.id, 'itinerary')} nestedInteractive>
          <div className={styles.nextTopRow}>
            <StampBadge tone={current ? 'teal' : 'gray'}>{current ? 'HAPPENING NOW' : 'NEXT UP'}</StampBadge>
            <span className={styles.nextCountdown}>{formatRelativeMinutes(minutesUntilMoment(upNext, todayStr(), nowTimeStr()))}</span>
          </div>
          <div className={styles.nextTitle}>{upNext.title}</div>
          <div className={styles.nextSubtitle}>
            {formatDateNoYear(upNext.date)} · {upNext.time}
            {upNext.subtitle ? ` · ${upNext.subtitle}` : ''}
          </div>
        </Card>
      )}

      <button type="button" className={styles.seeAll} onClick={onSeeAllTrips}>
        See all trips ›
      </button>

      {menuOpen && fullTrip && (
        <TripMenuSheet
          trip={fullTrip}
          onClose={() => setMenuOpen(false)}
          onShare={() => setShareOpen(true)}
          onDuplicate={() => setDuplicateOpen(true)}
          onExport={() => downloadTripAsJson(fullTrip)}
          onEditDescription={() => setEditDescriptionOpen(true)}
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

      {duplicateOpen && fullTrip && (
        <Suspense fallback={<ScreenLoadingFallback />}>
          <CreateTripWizardLazy
            onClose={() => setDuplicateOpen(false)}
            onCreated={() => setDuplicateOpen(false)}
            duplicateSeed={{
              categories: fullTrip.budgetCategories,
              checklistTemplateItems: fullTrip.checklistItems
                .filter((i) => i.travelerId === fullTrip.travelers[0]?.id)
                .map(({ text, category, quantity }) => ({ text, category, quantity })),
            }}
          />
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
    </div>
  );
}
