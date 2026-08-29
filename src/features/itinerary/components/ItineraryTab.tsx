import { useCallback, useMemo, useState } from 'react';
import { useToast } from '../../../app/providers/ToastProvider';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { dayNumber, weekdayShort, todayStr, formatDateNoYear } from '../../../shared/lib/dateFormat';
import { generateId } from '../../../shared/lib/id';
import { deleteEntityWithUndo } from '../../../shared/lib/deleteWithUndo';
import type { Trip } from '../../trips/types';
import { getTripDateRange } from '../../trips/lib/dateRange';
import { addRememberedLocation } from '../../trips/lib/rememberedLocations';
import { buildAutoPulledEntries } from '../lib/autoPulledEntries';
import type { Idea, ItineraryStop } from '../types';
import { AutoPulledEntryCard } from './AutoPulledEntryCard';
import { IdeasBacklog } from './IdeasBacklog';
import { StopCard } from './StopCard';
import { StopForm } from './StopForm';
import styles from './ItineraryTab.module.css';

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
  const range = getTripDateRange(trip.legs, trip.flights);
  const days = useMemo(() => (range ? buildDayRange(range.startDate, range.endDate) : []), [range?.startDate, range?.endDate]);
  const today = todayStr();
  const [selectedDate, setSelectedDate] = useState(() => (days.includes(today) ? today : days[0] ?? today));

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
    .map((l) => l.city || 'ΧΩΡΙΣ ΠΟΛΗ')
    .join(' → ')
    .toUpperCase();

  const saveStop = async (stop: ItineraryStop) => {
    await updateTrip((t) => {
      const exists = t.itineraryStops.some((s) => s.id === stop.id);
      const itineraryStops = exists ? t.itineraryStops.map((s) => (s.id === stop.id ? stop : s)) : [...t.itineraryStops, stop];
      const rememberedLocations = stop.location ? addRememberedLocation(t.rememberedLocations, stop.location) : t.rememberedLocations;
      return { ...t, itineraryStops, rememberedLocations };
    });
    showToast('Η στάση αποθηκεύτηκε.');
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
    showToast(`Μπήκε στις ${formatDateNoYear(date)} στις ${time}.`);
  };

  return (
    <div style={{ paddingTop: 8 }}>
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
          <div className={styles.legHeader}>Όλη μέρα</div>
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
          Κενή μέρα
          <br />
          Πρόσθεσε στάση ή τράβα μία από τις ιδέες σου παρακάτω.
        </div>
      )}

      <button type="button" className={styles.addStopButton} onClick={() => setCreatingStop(true)}>
        + Προσθήκη στάσης
      </button>

      <IdeasBacklog
        ideas={trip.ideas}
        defaultDate={selectedDate}
        onAdd={(idea) => void addIdea(idea)}
        onRemove={(id) => void removeIdea(id)}
        onAssignToDay={assignIdeaToDay}
      />

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
