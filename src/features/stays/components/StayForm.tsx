import { useState } from 'react';
import { useToast } from '../../../app/providers/ToastProvider';
import { Button } from '../../../shared/components/Button';
import { DateTimeField } from '../../../shared/components/DateTimeField';
import { FieldRow, MoreToggle, TextAreaField, TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { generateId } from '../../../shared/lib/id';
import { isEndOnOrAfterStart } from '../../trips/validation';
import { dateTimeRangesOverlap } from '../lib/overlap';
import type { Stay } from '../types';

interface StayFormProps {
  initial?: Stay;
  existingStays: Stay[];
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

function toRange(stay: Stay) {
  return {
    start: { date: stay.checkinDate, time: stay.checkinTime },
    end: { date: stay.checkoutDate, time: stay.checkoutTime },
  };
}

export function StayForm({ initial, existingStays, onClose, onSave, onDelete }: StayFormProps) {
  const { showToast } = useToast();
  const [stay, setStay] = useState<Stay>(initial ?? emptyStay());
  const [showMore, setShowMore] = useState(Boolean(initial?.phone || initial?.bookingRef || initial?.notes || initial?.link));

  const update = <K extends keyof Stay>(key: K, value: Stay[K]) => setStay((prev) => ({ ...prev, [key]: value }));

  const hasFullDates = stay.checkinDate && stay.checkinTime && stay.checkoutDate && stay.checkoutTime;
  const datesValid = !hasFullDates || isEndOnOrAfterStart(`${stay.checkinDate}T${stay.checkinTime}`, `${stay.checkoutDate}T${stay.checkoutTime}`);
  const overlapsLive =
    hasFullDates && datesValid && existingStays.some((other) => other.id !== stay.id && dateTimeRangesOverlap(toRange(stay), toRange(other)));

  const handleSave = () => {
    if (!stay.name.trim() || !stay.address.trim() || !hasFullDates) {
      showToast('Λείπουν στοιχεία διαμονής.', { variant: 'error' });
      return;
    }
    if (!datesValid) {
      showToast('Το check-out πρέπει να είναι μετά το check-in.', { variant: 'error' });
      return;
    }
    onSave(stay);
  };

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
          <Button variant="primary" onClick={handleSave}>
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

      {overlapsLive && (
        <div
          style={{
            background: 'var(--color-brass-soft)',
            color: 'var(--color-brass)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            fontSize: 'var(--fs-meta)',
            marginBottom: 16,
          }}
        >
          Αυτές οι νύχτες επικαλύπτονται με άλλη διαμονή. Μπορείς να το αποθηκεύσεις έτσι.
        </div>
      )}

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
