import { useMemo, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { ChipSelect } from '../../../shared/components/ChipSelect';
import { DateField } from '../../../shared/components/DateField';
import { DateTimeField } from '../../../shared/components/DateTimeField';
import { FieldRow, FieldWrapper, TextAreaField, TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { PresetChips } from '../../../shared/components/PresetChips';
import { formatDateNoYear } from '../../../shared/lib/dateFormat';
import { generateId } from '../../../shared/lib/id';
import type { Trip } from '../../trips/types';
import { computeOccupiedRanges } from '../lib/occupiedRanges';
import { describeActivityError, tripActivityRange, validateStopForSave } from '../lib/activityValidation';
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
  const [formError, setFormError] = useState<string | null>(null);
  const range = tripActivityRange(trip);

  const update = <K extends keyof ItineraryStop>(key: K, value: ItineraryStop[K]) => {
    setStop((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
  };

  const toggleAllDay = () => {
    setFormError(null);
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
  // decision. Stays keep their own separate warn-don't-block behavior. This
  // only drives which minutes the wheel picker shows as disabled; the
  // authoritative save-time gate is validateStopForSave (domain layer) below.
  const occupied = useMemo(
    () => computeOccupiedRanges({ date: stop.date, stops: trip.itineraryStops, flights: trip.flights, stays: trip.stays, excludeStopId: stop.id }),
    [stop.date, stop.id, trip.itineraryStops, trip.flights, trip.stays],
  );

  const isTimeDisabled = (hour: number, minute: number) => {
    const candidate = hour * 60 + minute;
    return occupied.some((r) => candidate >= r.startMin && candidate < r.endMin);
  };

  const canSave = stop.title.trim() && stop.date && (stop.allDay || stop.time);

  const dateCaption = range
    ? `This trip runs ${formatDateNoYear(range.startDate)} – ${formatDateNoYear(range.endDate)}. Dates outside that range can't be selected.`
    : undefined;

  const handleSave = () => {
    const errors = validateStopForSave(stop, trip, trip.itineraryStops);
    if (errors.length > 0) {
      // Show the first problem — subsequent ones (if any) surface once this one's fixed and Save is pressed again.
      setFormError(describeActivityError(errors[0]!, trip.itineraryStops));
      return;
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
        <DateField label="Date" date={stop.date} onChange={(d) => update('date', d)} minDate={range?.startDate} maxDate={range?.endDate} />
      ) : (
        <>
          <DateTimeField
            label="Time"
            date={stop.date}
            time={stop.time ?? ''}
            onDateChange={(d) => update('date', d)}
            onTimeChange={(t) => update('time', t)}
            minDate={range?.startDate}
            maxDate={range?.endDate}
            caption={dateCaption}
            isTimeDisabled={isTimeDisabled}
            error={formError ?? undefined}
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

      <FieldRow>
        <TextField
          label="Price (optional)"
          type="number"
          min={0}
          step="0.01"
          placeholder="0"
          value={stop.price ?? ''}
          onChange={(e) => update('price', e.target.value ? Number(e.target.value) : undefined)}
        />
        <TextField
          label="Currency"
          value={stop.currency ?? (stop.price != null ? trip.homeCurrency : '')}
          onChange={(e) => update('currency', e.target.value.toUpperCase() || undefined)}
        />
      </FieldRow>

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

      {stop.allDay && formError && <div className={styles.allDayError}>{formError}</div>}
    </Modal>
  );
}
