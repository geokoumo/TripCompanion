import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { DateTimeField } from '../../../shared/components/DateTimeField';
import { FieldRow, MoreToggle, TextAreaField, TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { generateId } from '../../../shared/lib/id';
import { isEndOnOrAfterStart } from '../../trips/validation';
import type { Stay } from '../types';

interface StayFormProps {
  initial?: Stay;
  onClose: () => void;
  onSave: (stay: Stay) => void;
  onDelete?: () => void;
}

const emptyStay = (): Stay => ({
  id: generateId(),
  name: '',
  address: '',
  checkinDate: '',
  checkinTime: '',
  checkoutDate: '',
  checkoutTime: '',
});

export function StayForm({ initial, onClose, onSave, onDelete }: StayFormProps) {
  const [stay, setStay] = useState<Stay>(initial ?? emptyStay());
  const [showMore, setShowMore] = useState(Boolean(initial?.phone || initial?.bookingRef || initial?.notes || initial?.link));

  const update = <K extends keyof Stay>(key: K, value: Stay[K]) => setStay((prev) => ({ ...prev, [key]: value }));

  const datesValid =
    !stay.checkinDate || !stay.checkinTime || !stay.checkoutDate || !stay.checkoutTime
      ? true
      : isEndOnOrAfterStart(`${stay.checkinDate}T${stay.checkinTime}`, `${stay.checkoutDate}T${stay.checkoutTime}`);

  const canSave = stay.name.trim() && stay.address.trim() && stay.checkinDate && stay.checkinTime && stay.checkoutDate && stay.checkoutTime;

  return (
    <Modal
      title={initial ? 'Επεξεργασία διαμονής' : 'Νέα διαμονή'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <Button variant="danger" onClick={onDelete}>
              Διαγραφή
            </Button>
          )}
          <Button variant="primary" disabled={!canSave || !datesValid} onClick={() => onSave(stay)}>
            Αποθήκευση
          </Button>
        </>
      }
    >
      <TextField label="Όνομα" autoFocus value={stay.name} onChange={(e) => update('name', e.target.value)} placeholder="π.χ. Shinjuku Granbell Hotel" />
      <TextField label="Διεύθυνση" value={stay.address} onChange={(e) => update('address', e.target.value)} placeholder="Απαραίτητο πεδίο" />

      <DateTimeField
        label="Check-in"
        date={stay.checkinDate}
        time={stay.checkinTime}
        onDateChange={(d) => update('checkinDate', d)}
        onTimeChange={(t) => update('checkinTime', t)}
      />
      <DateTimeField
        label="Check-out"
        date={stay.checkoutDate}
        time={stay.checkoutTime}
        onDateChange={(d) => update('checkoutDate', d)}
        onTimeChange={(t) => update('checkoutTime', t)}
        minDate={stay.checkinDate || undefined}
      />
      {!datesValid && <p style={{ color: 'var(--color-rust)', fontSize: 13 }}>Το check-out πρέπει να είναι μετά το check-in.</p>}

      <TextField label="Σύνδεσμος" value={stay.link ?? ''} onChange={(e) => update('link', e.target.value)} placeholder="https://…" />

      <MoreToggle open={showMore} onToggle={() => setShowMore((v) => !v)} />
      {showMore && (
        <>
          <FieldRow>
            <TextField label="Τηλέφωνο" value={stay.phone ?? ''} onChange={(e) => update('phone', e.target.value)} />
            <TextField label="Κωδικός κράτησης" value={stay.bookingRef ?? ''} onChange={(e) => update('bookingRef', e.target.value)} />
          </FieldRow>
          <TextAreaField label="Σημειώσεις" value={stay.notes ?? ''} onChange={(e) => update('notes', e.target.value)} />
        </>
      )}
    </Modal>
  );
}
