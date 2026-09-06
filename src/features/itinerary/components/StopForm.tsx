import { useMemo, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { ChipSelect } from '../../../shared/components/ChipSelect';
import { DateField } from '../../../shared/components/DateField';
import { DateTimeField } from '../../../shared/components/DateTimeField';
import { FieldWrapper, TextAreaField, TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { PresetChips } from '../../../shared/components/PresetChips';
import { generateId } from '../../../shared/lib/id';
import type { Trip } from '../../trips/types';
import { computeOccupiedRanges, findConflict, formatRangeLabel } from '../lib/occupiedRanges';
import { StopTypeGrid } from './StopTypeGrid';
import type { ItineraryStop } from '../types';
import styles from './StopForm.module.css';

interface StopFormProps {
  initial?: ItineraryStop;
  defaultDate: string;
  trip: Trip;
  onClose: () => void;
  onSave: (stop: ItineraryStop) => void;
  onDelete?: () => void;
}

const emptyStop = (date: string): ItineraryStop => ({
  id: generateId(),
  date,
  time: '',
  allDay: false,
  title: '',
  type: 'sight',
  travelerIds: [],
  done: false,
});

const DURATION_PRESETS = ['30′', '60′', '90′', '120′', '180′'];

export function StopForm({ initial, defaultDate, trip, onClose, onSave, onDelete }: StopFormProps) {
  const [stop, setStop] = useState<ItineraryStop>(initial ?? emptyStop(defaultDate));
  const [conflictError, setConflictError] = useState<string | null>(null);

  const update = <K extends keyof ItineraryStop>(key: K, value: ItineraryStop[K]) => {
    setStop((prev) => ({ ...prev, [key]: value }));
    setConflictError(null);
  };

  const toggleAllDay = () => {
    setConflictError(null);
    setStop((prev) => {
      const allDay = !prev.allDay;
      // A stop can't have both a specific time and be all-day — clear the
      // time/duration fields when switching into all-day so nothing stale lingers.
      return { ...prev, allDay, time: allDay ? undefined : prev.time, durationMinutes: allDay ? undefined : prev.durationMinutes };
    });
  };

  const applyDurationPreset = (preset: string) => update('durationMinutes', Number(preset.replace('′', '')));

  const toggleTraveler = (id: string) => {
    update('travelerIds', stop.travelerIds.includes(id) ? stop.travelerIds.filter((t) => t !== id) : [...stop.travelerIds, id]);
  };

  // Round 8: itinerary stops hard-block on an occupied time slot instead of
  // warning — a deliberate reversal of the original warn-don't-block
  // decision. Stays keep their own separate warn-don't-block behavior.
  const occupied = useMemo(
    () => computeOccupiedRanges({ date: stop.date, stops: trip.itineraryStops, flights: trip.flights, stays: trip.stays, excludeStopId: stop.id }),
    [stop.date, stop.id, trip.itineraryStops, trip.flights, trip.stays],
  );

  const isTimeDisabled = (hour: number, minute: number) => {
    const candidate = hour * 60 + minute;
    return occupied.some((r) => candidate >= r.startMin && candidate < r.endMin);
  };

  const canSave = stop.title.trim() && stop.date && (stop.allDay || stop.time);

  const handleSave = () => {
    if (!stop.allDay && stop.time && stop.durationMinutes) {
      const [h, m] = stop.time.split(':').map(Number);
      const startMin = (h ?? 0) * 60 + (m ?? 0);
      const conflict = findConflict(startMin, stop.durationMinutes, occupied);
      if (conflict) {
        setConflictError(`This time overlaps with "${conflict.label}" ${formatRangeLabel(conflict)}.`);
        return;
      }
    }
    onSave(stop);
  };

  return (
    <Modal
      title={initial ? 'Edit stop' : 'New stop'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button variant="primary" disabled={!canSave} onClick={handleSave}>
            Save
          </Button>
        </>
      }
    >
      <TextField label="What" autoFocus value={stop.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Sensō-ji Temple" />

      <FieldWrapper label="Type">
        <StopTypeGrid value={stop.type} onChange={(id) => update('type', id)} />
      </FieldWrapper>

      <div className={styles.allDayRow}>
        <button type="button" className={styles.allDayToggle} data-active={stop.allDay} onClick={toggleAllDay}>
          All day
        </button>
      </div>

      {stop.allDay ? (
        <DateField label="Date" date={stop.date} onChange={(d) => update('date', d)} />
      ) : (
        <>
          <DateTimeField
            label="Time"
            date={stop.date}
            time={stop.time ?? ''}
            onDateChange={(d) => update('date', d)}
            onTimeChange={(t) => update('time', t)}
            isTimeDisabled={isTimeDisabled}
            error={conflictError ?? undefined}
          />
          <FieldWrapper label={stop.durationMinutes ? `Duration — ${stop.durationMinutes}′` : 'Duration (optional)'}>
            <PresetChips presets={DURATION_PRESETS} onSelect={applyDurationPreset} hideInput />
          </FieldWrapper>
        </>
      )}

      {trip.rememberedLocations.length > 0 && (
        <PresetChips presets={trip.rememberedLocations} onSelect={(v) => update('location', v)} hideInput />
      )}
      <TextField label="Location" value={stop.location ?? ''} onChange={(e) => update('location', e.target.value)} />

      {trip.travelers.length > 0 && (
        <FieldWrapper label="Travellers (blank = everyone)">
          <ChipSelect
            options={trip.travelers.map((t) => ({ id: t.id, label: t.name }))}
            value={stop.travelerIds}
            onChange={toggleTraveler}
            multi
          />
        </FieldWrapper>
      )}

      <TextField label="Link" value={stop.link ?? ''} onChange={(e) => update('link', e.target.value)} placeholder="https://…" />
      <TextAreaField label="Note" value={stop.note ?? ''} onChange={(e) => update('note', e.target.value)} />
    </Modal>
  );
}
