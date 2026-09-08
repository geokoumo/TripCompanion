import { useState } from 'react';
import { useToast } from '../../../app/providers/ToastProvider';
import { Button } from '../../../shared/components/Button';
import { DateTimeField } from '../../../shared/components/DateTimeField';
import { FieldRow, MoreToggle, TextAreaField, TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { PresetChips } from '../../../shared/components/PresetChips';
import { generateId } from '../../../shared/lib/id';
import { isEndOnOrAfterStart } from '../../trips/validation';
import { dateTimeRangesOverlap } from '../lib/overlap';
import type { Stay } from '../types';

interface StayFormProps {
  initial?: Stay;
  existingStays: Stay[];
  recentLocations: string[];
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

export function StayForm({ initial, existingStays, recentLocations, onClose, onSave, onDelete }: StayFormProps) {
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
      showToast('Missing stay details.', { variant: 'error' });
      return;
    }
    if (!datesValid) {
      showToast('Check-out must be after check-in.', { variant: 'error' });
      return;
    }
    onSave(stay);
  };

  return (
    <Modal
      title={initial ? 'Edit stay' : 'New stay'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </>
      }
    >
      <TextField label="Name" autoFocus value={stay.name} onChange={(e) => update('name', e.target.value)} placeholder="Hotel or rental" />
      {recentLocations.length > 0 && <PresetChips presets={recentLocations} onSelect={(v) => update('address', v)} hideInput />}
      <TextField label="Address" value={stay.address} onChange={(e) => update('address', e.target.value)} placeholder="Street, area" />

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
      {hasFullDates && !datesValid && (
        <p style={{ color: 'var(--color-danger)', fontSize: 13, marginTop: -8, marginBottom: 16 }}>
          Check-out must be on or after check-in.
        </p>
      )}

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
          ⚠ These nights overlap with another stay. You can save it this way.
        </div>
      )}

      <MoreToggle open={showMore} onToggle={() => setShowMore((v) => !v)} />
      {showMore && (
        <>
          <FieldRow>
            <TextField label="Phone" value={stay.phone ?? ''} onChange={(e) => update('phone', e.target.value)} placeholder="+81 …" />
            <TextField label="Booking reference" value={stay.bookingRef ?? ''} onChange={(e) => update('bookingRef', e.target.value)} placeholder="HB-88213" />
          </FieldRow>
          <TextAreaField
            label="Notes"
            value={stay.notes ?? ''}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Breakfast, door code…"
          />
          <TextField label="Link" value={stay.link ?? ''} onChange={(e) => update('link', e.target.value)} placeholder="https://…" />
        </>
      )}
    </Modal>
  );
}
