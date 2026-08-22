import { useState } from 'react';
import { ITINERARY_STOP_TYPES } from '../../../config/constants';
import { Button } from '../../../shared/components/Button';
import { ChipSelect } from '../../../shared/components/ChipSelect';
import { DateTimeField } from '../../../shared/components/DateTimeField';
import { FieldWrapper, TextAreaField, TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { generateId } from '../../../shared/lib/id';
import type { ItineraryStopTypeId } from '../../../config/constants';
import type { Traveler } from '../../travelers/types';
import type { ItineraryStop } from '../types';

interface StopFormProps {
  initial?: ItineraryStop;
  defaultDate: string;
  travelers: Traveler[];
  onClose: () => void;
  onSave: (stop: ItineraryStop) => void;
  onDelete?: () => void;
}

const emptyStop = (date: string): ItineraryStop => ({
  id: generateId(),
  date,
  time: '',
  title: '',
  type: 'sight',
  travelerIds: [],
  done: false,
});

export function StopForm({ initial, defaultDate, travelers, onClose, onSave, onDelete }: StopFormProps) {
  const [stop, setStop] = useState<ItineraryStop>(initial ?? emptyStop(defaultDate));
  const [useDuration, setUseDuration] = useState(Boolean(initial?.durationMinutes));

  const update = <K extends keyof ItineraryStop>(key: K, value: ItineraryStop[K]) => setStop((prev) => ({ ...prev, [key]: value }));

  const toggleTraveler = (id: string) => {
    update('travelerIds', stop.travelerIds.includes(id) ? stop.travelerIds.filter((t) => t !== id) : [...stop.travelerIds, id]);
  };

  const canSave = stop.title.trim() && stop.date && stop.time;

  return (
    <Modal
      title={initial ? 'Επεξεργασία στάσης' : 'Νέα στάση'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <Button variant="danger" onClick={onDelete}>
              Διαγραφή
            </Button>
          )}
          <Button variant="primary" disabled={!canSave} onClick={() => onSave(stop)}>
            Αποθήκευση
          </Button>
        </>
      }
    >
      <TextField label="Τίτλος" autoFocus value={stop.title} onChange={(e) => update('title', e.target.value)} placeholder="π.χ. Πρωινό στην αγορά" />

      <FieldWrapper label="Τύπος">
        <ChipSelect
          options={ITINERARY_STOP_TYPES.map((t) => ({ id: t.id, label: t.label }))}
          value={stop.type as ItineraryStopTypeId}
          onChange={(id) => update('type', id)}
        />
      </FieldWrapper>

      <DateTimeField label="Ώρα" date={stop.date} time={stop.time} onDateChange={(d) => update('date', d)} onTimeChange={(t) => update('time', t)} />

      {!useDuration ? (
        <button type="button" onClick={() => setUseDuration(true)} style={{ background: 'none', border: 'none', color: 'var(--color-rust)', cursor: 'pointer', marginBottom: 12 }}>
          + Προσθήκη διάρκειας
        </button>
      ) : (
        <TextField
          label="Διάρκεια (λεπτά)"
          type="number"
          min={5}
          value={stop.durationMinutes ?? ''}
          onChange={(e) => update('durationMinutes', e.target.value ? Number(e.target.value) : undefined)}
        />
      )}

      <TextField label="Τοποθεσία" value={stop.location ?? ''} onChange={(e) => update('location', e.target.value)} />

      {travelers.length > 0 && (
        <FieldWrapper label="Ταξιδιώτες (κενό = όλοι)">
          <ChipSelect
            options={travelers.map((t) => ({ id: t.id, label: t.name }))}
            value={stop.travelerIds}
            onChange={toggleTraveler}
            multi
          />
        </FieldWrapper>
      )}

      <TextField label="Σύνδεσμος" value={stop.link ?? ''} onChange={(e) => update('link', e.target.value)} placeholder="https://…" />
      <TextAreaField label="Σημείωση" value={stop.note ?? ''} onChange={(e) => update('note', e.target.value)} />
    </Modal>
  );
}
