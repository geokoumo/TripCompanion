import { useMemo, useState } from 'react';
import { useToast } from '../../../app/providers/ToastProvider';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { dayNumber, weekdayShort, todayStr } from '../../../shared/lib/dateFormat';
import { generateId } from '../../../shared/lib/id';
import { rangesOverlap, toComparableMs } from '../../stays/lib/overlap';
import type { Trip } from '../../trips/types';
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
  const days = useMemo(() => buildDayRange(trip.startDate, trip.endDate), [trip.startDate, trip.endDate]);
  const today = todayStr();
  const [selectedDate, setSelectedDate] = useState(() => (days.includes(today) ? today : days[0] ?? today));

  const [editingStop, setEditingStop] = useState<ItineraryStop | null>(null);
  const [creatingStop, setCreatingStop] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ItineraryStop | null>(null);

  const autoPulled = useMemo(() => buildAutoPulledEntries(trip.flights, trip.stays), [trip.flights, trip.stays]);
  const autoPulledForDay = autoPulled.filter((e) => e.date === selectedDate);
  const stopsForDay = trip.itineraryStops.filter((s) => s.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));

  const overlapIds = new Set<string>();
  for (let i = 0; i < stopsForDay.length; i++) {
    const a = stopsForDay[i]!;
    if (!a.durationMinutes) continue;
    const aStart = toComparableMs(a.date, a.time);
    const aEnd = aStart + a.durationMinutes * 60_000;
    for (let j = i + 1; j < stopsForDay.length; j++) {
      const b = stopsForDay[j]!;
      if (!b.durationMinutes) continue;
      const bStart = toComparableMs(b.date, b.time);
      const bEnd = bStart + b.durationMinutes * 60_000;
      if (rangesOverlap(aStart, aEnd, bStart, bEnd)) {
        overlapIds.add(a.id);
        overlapIds.add(b.id);
      }
    }
  }

  const legForDay = trip.legs.find((leg) => selectedDate >= leg.startDate && selectedDate <= leg.endDate);

  const saveStop = async (stop: ItineraryStop) => {
    await updateTrip((t) => {
      const exists = t.itineraryStops.some((s) => s.id === stop.id);
      return { ...t, itineraryStops: exists ? t.itineraryStops.map((s) => (s.id === stop.id ? stop : s)) : [...t.itineraryStops, stop] };
    });
    showToast('Η στάση αποθηκεύτηκε', 'success');
    setEditingStop(null);
    setCreatingStop(false);
  };

  const removeStop = async (id: string) => {
    await updateTrip((t) => ({ ...t, itineraryStops: t.itineraryStops.filter((s) => s.id !== id) }));
    setPendingDelete(null);
    setEditingStop(null);
    showToast('Η στάση διαγράφηκε', 'success');
  };

  const addIdea = (idea: Idea) => updateTrip((t) => ({ ...t, ideas: [...t.ideas, idea] }));
  const removeIdea = (id: string) => updateTrip((t) => ({ ...t, ideas: t.ideas.filter((i) => i.id !== id) }));
  const assignIdeaToDay = (idea: Idea) => {
    const date = idea.suggestedDate ?? selectedDate;
    const stop: ItineraryStop = {
      id: generateId(),
      date,
      time: '09:00',
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
    showToast(`Προστέθηκε στο πρόγραμμα στις ${date}`, 'success');
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

      {legForDay && <div className={styles.legHeader}>{legForDay.city.toUpperCase()}</div>}

      {autoPulledForDay.map((entry) => (
        <AutoPulledEntryCard key={entry.id} entry={entry} />
      ))}
      {stopsForDay.map((stop) => (
        <StopCard key={stop.id} stop={stop} travelers={trip.travelers} overlapping={overlapIds.has(stop.id)} onOpen={() => setEditingStop(stop)} />
      ))}
      {autoPulledForDay.length === 0 && stopsForDay.length === 0 && <div className={styles.emptyDay}>Δεν υπάρχουν στάσεις για αυτή τη μέρα.</div>}

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
          travelers={trip.travelers}
          onClose={() => {
            setCreatingStop(false);
            setEditingStop(null);
          }}
          onSave={(s) => void saveStop(s)}
          onDelete={editingStop ? () => setPendingDelete(editingStop) : undefined}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Διαγραφή στάσης"
          message={`Θα διαγραφεί η στάση "${pendingDelete.title}".`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void removeStop(pendingDelete.id)}
        />
      )}
    </div>
  );
}
