import { useState } from 'react';
import { formatDateShort } from '../lib/dateFormat';
import { CalendarDatePicker } from './CalendarDatePicker';
import { FieldWrapper } from './Field';
import { Modal } from './Modal';
import styles from './DateTimeField.module.css';

interface DateFieldProps {
  label: string;
  date: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  error?: string;
}

export function DateField({ label, date, onChange, minDate, maxDate, error }: DateFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <FieldWrapper label={label} error={error}>
      <div className={styles.row}>
        <button type="button" className={styles.pill} onClick={() => setOpen(true)}>
          {date ? formatDateShort(date) : 'Επίλεξε ημερομηνία'}
        </button>
      </div>
      {open && (
        <Modal title="Ημερομηνία" onClose={() => setOpen(false)}>
          <CalendarDatePicker
            value={date}
            minDate={minDate}
            maxDate={maxDate}
            onChange={(d) => {
              onChange(d);
              setOpen(false);
            }}
          />
        </Modal>
      )}
    </FieldWrapper>
  );
}
