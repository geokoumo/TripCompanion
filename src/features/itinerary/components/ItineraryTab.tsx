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
import type { Trip } from '../../trips/types';
import { getTripDateRange } from '../../trips/lib/dateRange';
import { addRememberedLocation } from '../../trips/lib/rememberedLocations';
import { buildAutoPulledEntries } from '../lib/autoPulledEntries';
import { describeActivityError, validateStopForSave } from '../lib/activityValidation';
import type { Idea, ItineraryStop } from '../types';
import { AutoPulledEntryCard } from './AutoPulledEntryCard';
import { IdeasBacklog } from './IdeasBacklog';
import { StopCard } from './StopCard';
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
  const [creatingStop, setCreatingStop] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ItineraryStop | null>(null);

  const autoPulled = useMemo(() => buildAutoPulledEntries(trip.flights, trip.stays), [trip.flights, trip.stays]);
  const autoPulledForDay = autoPulled.filter((e) => e.date === selectedDate);
  const stopsForDay = trip.itineraryStops.filter((s) => s.date === selectedDate);
  const allDayStopsForDay = stopsForDay.filter((s) => s.allDay);
  const timedStopsForDay = stopsForDay.filter((s) => !s.allDay).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));

  const openStop = useCallback((stop: ItineraryStop) => setEditingStop(stop), []);

  const legsForDay = trip.legs.filter((leg) => selectedDate >= leg.startDate && selectedDate <= leg.endDate);
  const legHeaderLabel = legsForDay
    .map((l) => l.city || 'NO CITY')
    .join(' → ')
    .toUpperCase();

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

    await updateTrip((t) => {
      const withStop = upsertItineraryStop(t, stop);
      const rememberedLocations = stop.location ? addRememberedLocation(t.rememberedLocations, stop.location) : t.rememberedLocations;
      return { ...withStop, rememberedLocations };
    });
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
    <div style={{ paddingTop: 8 }}>
      <div className={styles.viewSwitcher}>
        <StampToggle options={VIEW_OPTIONS} value={view} onChange={setView} variant="plain" layout="fill" />
      </div>

      {view === 'today' ? (
        <TodayView trip={trip} onOpenStop={openStop} />
      ) : (
        <>
          <div className={styles.dayTabs}>
            {days.map((date) => (
              <div key={date} className={styles.dayTab} data-active={date === selectedDate} onClick={() => setSelectedDate(date)}>
                <div className={styles.dayTabWeekday}>{weekdayShort(date)}</div>
                <div className={styles.dayTabNumber}>{dayNumber(date)}</div>
              </div>
            ))}
          </div>

          {legsForDay.length > 0 && <div className={styles.legHeader}>{legHeaderLabel}</div>}

          {allDayStopsForDay.length > 0 && (
            <>
              <div className={styles.legHeader}>All day</div>
              {allDayStopsForDay.map((stop) => (
                <StopCard key={stop.id} stop={stop} travelers={trip.travelers} onOpen={openStop} />
              ))}
            </>
          )}

          {autoPulledForDay.map((entry) => (
            <AutoPulledEntryCard key={entry.id} entry={entry} />
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
          onSave={(s) => void saveStop(s)}
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
    </div>
  );
}
