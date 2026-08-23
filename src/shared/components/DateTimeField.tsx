import { useState } from 'react';
import { formatDateShort } from '../lib/dateFormat';
import { Button } from './Button';
import { CalendarDatePicker } from './CalendarDatePicker';
import { WheelTimePicker } from './WheelTimePicker';
import { FieldWrapper } from './Field';
import { Modal } from './Modal';
import styles from './DateTimeField.module.css';

interface DateTimeFieldProps {
  label: string;
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  minDate?: string;
  maxDate?: string;
  caption?: string;
  error?: string;
}

export function DateTimeField({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  minDate,
  maxDate,
  caption,
  error,
}: DateTimeFieldProps) {
  const [open, setOpen] = useState<'date' | 'time' | null>(null);

  const openPicker = (which: 'date' | 'time') => {
    // Blur whatever's focused (e.g. a text field with the keyboard still up)
    // before mounting the picker sheet — otherwise on iOS the still-open
    // keyboard can leave the new fixed-position sheet rendered offset.
    (document.activeElement as HTMLElement | null)?.blur();
    setOpen(which);
  };

  return (
    <FieldWrapper label={label} caption={caption} error={error}>
      <div className={styles.row}>
        <button type="button" className={styles.pill} onClick={() => openPicker('date')}>
          {date ? formatDateShort(date) : 'Επίλεξε ημερομηνία'}
        </button>
        <button type="button" className={styles.pill} onClick={() => openPicker('time')}>
          {time || '--:--'}
        </button>
      </div>
      {open === 'date' && (
        <Modal title="Ημερομηνία" onClose={() => setOpen(null)}>
          <CalendarDatePicker
            value={date}
            minDate={minDate}
            maxDate={maxDate}
            onChange={(d) => {
              onDateChange(d);
              setOpen(null);
            }}
          />
        </Modal>
      )}
      {open === 'time' && (
        <Modal
          title="Ώρα"
          onClose={() => setOpen(null)}
          footer={
            <Button variant="primary" onClick={() => setOpen(null)}>
              Έτοιμο
            </Button>
          }
        >
          <WheelTimePicker value={time || '00:00'} onChange={onTimeChange} />
        </Modal>
      )}
    </FieldWrapper>
  );
}
