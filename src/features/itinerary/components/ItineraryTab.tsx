import { useCallback, useMemo, useState } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { Fab } from '../../../shared/components/Button';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { StampToggle } from '../../../shared/components/StampToggle';
import { dayNumber, weekdayShort, todayStr, formatDateNoYear } from '../../../shared/lib/dateFormat';
import { generateId } from '../../../shared/lib/id';
import { deleteEntityWithUndo } from '../../../shared/lib/deleteWithUndo';
import { upsertItineraryStop } from '../../../data/repository/activityRepository';
import { FlightDetailView } from '../../flights/components/FlightDetailView';
import { FlightForm } from '../../flights/components/FlightForm';
import type { Flight } from '../../flights/types';
import { StayDetailView } from '../../stays/components/StayDetailView';
import { StayForm } from '../../stays/components/StayForm';
import type { Stay } from '../../stays/types';
import type { Trip } from '../../trips/types';
import { getTripDateRange } from '../../trips/lib/dateRange';
import { addRememberedLocation } from '../../trips/lib/rememberedLocations';
import { autoPulledEntryMeta, buildAutoPulledEntries, resolveAutoPulledSource, type AutoPulledSource } from '../lib/autoPulledEntries';
import { describeActivityError, validateStopForSave } from '../lib/activityValidation';
import { computeDayProgress, legContextForDate } from '../lib/tripDayContext';
import type { AutoPulledEntry, Idea, ItineraryStop } from '../types';
import { AutoPulledEntryCard } from './AutoPulledEntryCard';
import { IdeasBacklog } from './IdeasBacklog';
import { StopCard } from './StopCard';
import { StopDetailView } from './StopDetailView';
import { StopForm } from './StopForm';
import { TodayView } from './TodayView';
import styles from './ItineraryTab.module.css';

type ItineraryView = 'plan' | 'today';
const VIEW_OPTIONS: { id: ItineraryView; label: string }[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'today', label: 'Today' },
];

interface ItineraryTabProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
}

function buildDayRange(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    days.push(cursor);
    const [y, m, d] = cursor.split('-').map(Number);
    const next = new Date(y!, m! - 1, d! + 1);
    cursor = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
  }
  return days;
}

export function ItineraryTab({ trip, updateTrip }: ItineraryTabProps) {
  const { showToast } = useToast();
  const { getFullTrip } = useTripsContext();
  const range = getTripDateRange(trip.legs, trip.flights);
  const days = useMemo(() => (range ? buildDayRange(range.startDate, range.endDate) : []), [range?.startDate, range?.endDate]);
  const today = todayStr();
  const [selectedDate, setSelectedDate] = useState(() => (days.includes(today) ? today : days[0] ?? today));
  const [view, setView] = useState<ItineraryView>('plan');

  const [editingStop, setEditingStop] = useState<ItineraryStop | null>(null);
  const [viewingStop, setViewingStop] = useState<ItineraryStop | null>(null);
  const [creatingStop, setCreatingStop] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ItineraryStop | null>(null);

  // A flight/stay reached by tapping its auto-pulled itinerary checkpoint —
  // the exact same entity Flights/Stays edits, just a second entry point to
  // it. Viewing is read-only (StopDetailView-style); Edit hands off to the
  // same FlightForm/StayForm those tabs use, never a parallel edit path.
  const [viewingAutoPulled, setViewingAutoPulled] = useState<AutoPulledSource | null>(null);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [editingStay, setEditingStay] = useState<Stay | null>(null);

  const autoPulled = useMemo(() => buildAutoPulledEntries(trip.flights, trip.stays), [trip.flights, trip.stays]);
  const autoPulledForDay = autoPulled.filter((e) => e.date === selectedDate);
  const stopsForDay = trip.itineraryStops.filter((s) => s.date === selectedDate);
  const allDayStopsForDay = stopsForDay.filter((s) => s.allDay);
  const timedStopsForDay = stopsForDay.filter((s) => !s.allDay).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));

  const openStop = useCallback((stop: ItineraryStop) => setViewingStop(stop), []);
  const openAutoPulledEntry = useCallback(
    (entry: AutoPulledEntry) => {
      const source = resolveAutoPulledSource(entry, trip.flights, trip.stays);
      if (source) setViewingAutoPulled(source);
    },
    [trip.flights, trip.stays],
  );

  const saveFlight = async (flight: Flight) => {
    await updateTrip((t) => ({
      ...t,
      flights: t.flights.some((f) => f.id === flight.id) ? t.flights.map((f) => (f.id === flight.id ? flight : f)) : [...t.flights, flight],
    }));
    showToast('Flight saved.');
    setEditingFlight(null);
  };

  const saveStay = async (stay: Stay) => {
    await updateTrip((t) => {
      const exists = t.stays.some((s) => s.id === stay.id);
      const stays = exists ? t.stays.map((s) => (s.id === stay.id ? stay : s)) : [...t.stays, stay];
      const rememberedLocations = stay.address ? addRememberedLocation(t.rememberedLocations, stay.address) : t.rememberedLocations;
      return { ...t, stays, rememberedLocations };
    });
    showToast('Stay saved.');
    setEditingStay(null);
  };

  const legsForDay = trip.legs.filter((leg) => selectedDate >= leg.startDate && selectedDate <= leg.endDate);
  const primaryLegForDay = legsForDay[0];
  const legContext = primaryLegForDay ? legContextForDate(primaryLegForDay, selectedDate) : null;
  const dayProgress = computeDayProgress(days, selectedDate);
  const legCities = legsForDay.map((l) => l.city).filter(Boolean);
  const legHeaderText = [
    dayProgress && `DAY ${dayProgress.dayNumber} OF ${dayProgress.totalDays}`,
    legCities.length > 0 ? legCities.join(' → ').toUpperCase() : null,
    legContext === 'arrival' ? 'ARRIVAL' : legContext === 'departure' ? 'DEPARTURE' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // Final gate before writing: re-fetches the trip fresh (Supabase, not
  // whatever's been sitting in this tab's memory) and revalidates against
  // that, so a conflict introduced from another tab/device since this form
  // was opened is still caught. The form itself already ran the same check
  // against in-memory data for instant feedback (see StopForm.handleSave) —
  // this is the authoritative repeat, not the only one.
  const saveStop = async (stop: ItineraryStop) => {
    const freshTrip = (await getFullTrip(trip.id)) ?? trip;
    const errors = validateStopForSave(stop, freshTrip, freshTrip.itineraryStops);
    if (errors.length > 0) {
      showToast(describeActivityError(errors[0]!, freshTrip.itineraryStops), { variant: 'error' });
      return;
    }

    // Deliberately NOT feeding stop.location into rememberedLocations — see
    // recentStopLocations.ts: that pool backs StayForm's address suggestions,
    // and a casual activity location doesn't belong there.
    await updateTrip((t) => upsertItineraryStop(t, stop));
    showToast('Stop saved.');
    setEditingStop(null);
    setCreatingStop(false);
  };

  const removeStop = (id: string) => {
    deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'itineraryStops', id });
    setPendingDelete(null);
    setEditingStop(null);
  };

  const addIdea = (idea: Idea) => updateTrip((t) => ({ ...t, ideas: [...t.ideas, idea] }));
  const removeIdea = (id: string) => deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'ideas', id });
  const assignIdeaToDay = (idea: Idea) => {
    const date = idea.suggestedDate ?? selectedDate;
    const time = '12:00';
    const stop: ItineraryStop = {
      id: generateId(),
      date,
      time,
      allDay: false,
      durationMinutes: 60,
      title: idea.title,
      type: idea.type,
      location: idea.location,
      link: idea.link,
      note: idea.note,
      travelerIds: [],
      done: false,
    };
    void updateTrip((t) => ({
      ...t,
      ideas: t.ideas.filter((i) => i.id !== idea.id),
      itineraryStops: [...t.itineraryStops, stop],
    }));
    showToast(`Added to ${formatDateNoYear(date)} at ${time}.`);
  };

  return (
    // Bottom padding clears the floating "+" button so the last card (or the
    // ideas backlog's own input row) never sits underneath it.
    <div style={{ paddingTop: 8, paddingBottom: 90 }}>
      <div className={styles.viewSwitcher}>
        <StampToggle options={VIEW_OPTIONS} value={view} onChange={setView} variant="plain" layout="fill" />
      </div>

      {view === 'today' ? (
        <TodayView trip={trip} onOpenStop={openStop} onOpenAutoPulledEntry={openAutoPulledEntry} />
      ) : (
        <>
          <div className={styles.dayTabs} role="tablist" aria-label="Days">
            {days.map((date) => (
              <button
                key={date}
                type="button"
                role="tab"
                aria-selected={date === selectedDate}
                className={styles.dayTab}
                data-active={date === selectedDate}
                onClick={() => setSelectedDate(date)}
              >
                <div className={styles.dayTabWeekday}>{weekdayShort(date)}</div>
                <div className={styles.dayTabNumber}>{dayNumber(date)}</div>
                {(() => {
                  const progress = computeDayProgress(days, date);
                  return progress && <div className={styles.dayTabTripDay}>D{progress.dayNumber}</div>;
                })()}
              </button>
            ))}
          </div>

          {legHeaderText && <div className={styles.legHeader}>{legHeaderText}</div>}

          {allDayStopsForDay.length > 0 && (
            <>
              <div className={styles.legHeader}>All day</div>
              {allDayStopsForDay.map((stop) => (
                <StopCard key={stop.id} stop={stop} travelers={trip.travelers} onOpen={openStop} />
              ))}
            </>
          )}

          {autoPulledForDay.map((entry) => (
            <AutoPulledEntryCard
              key={entry.id}
              entry={entry}
              meta={autoPulledEntryMeta(entry, trip.flights, trip.stays)}
              onOpen={openAutoPulledEntry}
            />
          ))}
          {timedStopsForDay.map((stop) => (
            <StopCard key={stop.id} stop={stop} travelers={trip.travelers} onOpen={openStop} />
          ))}
          {autoPulledForDay.length === 0 && stopsForDay.length === 0 && (
            <div className={styles.emptyDay}>
              Empty day
              <br />
              Add a stop, or pull one of your ideas up from below.
            </div>
          )}

          <IdeasBacklog
            ideas={trip.ideas}
            defaultDate={selectedDate}
            onAdd={(idea) => void addIdea(idea)}
            onRemove={(id) => void removeIdea(id)}
            onAssignToDay={assignIdeaToDay}
          />
        </>
      )}

      <Fab onClick={() => setCreatingStop(true)} aria-label="New stop" />

      {(creatingStop || editingStop) && (
        <StopForm
          initial={editingStop ?? undefined}
          defaultDate={selectedDate}
          trip={trip}
          onClose={() => {
            setCreatingStop(false);
            setEditingStop(null);
          }}
          onSave={(s) => saveStop(s)}
          onDelete={editingStop ? () => setPendingDelete(editingStop) : undefined}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmSheet
          itemName={pendingDelete.title}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => removeStop(pendingDelete.id)}
        />
      )}

      {viewingStop && (
        <StopDetailView
          stop={viewingStop}
          travelers={trip.travelers}
          onClose={() => setViewingStop(null)}
          onEdit={() => {
            setEditingStop(viewingStop);
            setViewingStop(null);
          }}
        />
      )}

      {viewingAutoPulled?.kind === 'flight' && (
        <FlightDetailView
          flight={viewingAutoPulled.flight}
          trip={trip}
          updateTrip={updateTrip}
          onClose={() => setViewingAutoPulled(null)}
          onEdit={() => {
            setEditingFlight(viewingAutoPulled.flight);
            setViewingAutoPulled(null);
          }}
        />
      )}
      {viewingAutoPulled?.kind === 'stay' && (
        <StayDetailView
          stay={viewingAutoPulled.stay}
          trip={trip}
          updateTrip={updateTrip}
          onClose={() => setViewingAutoPulled(null)}
          onEdit={() => {
            setEditingStay(viewingAutoPulled.stay);
            setViewingAutoPulled(null);
          }}
        />
      )}
      {editingFlight && (
        <FlightForm trip={trip} updateTrip={updateTrip} initial={editingFlight} onClose={() => setEditingFlight(null)} onSave={(f) => saveFlight(f)} />
      )}
      {editingStay && (
        <StayForm
          trip={trip}
          updateTrip={updateTrip}
          initial={editingStay}
          existingStays={trip.stays}
          recentLocations={trip.rememberedLocations}
          onClose={() => setEditingStay(null)}
          onSave={(s) => saveStay(s)}
        />
      )}
    </div>
  );
}
