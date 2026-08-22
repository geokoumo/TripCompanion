import { useState } from 'react';
import { formatDateShort } from '../lib/dateFormat';
import { CalendarDatePicker } from './CalendarDatePicker';
import { FieldWrapper } from './Field';
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
        <button type="button" className={styles.pill} data-open={open} onClick={() => setOpen((v) => !v)}>
          {date ? formatDateShort(date) : 'Επίλεξε ημερομηνία'}
        </button>
        {open && (
          <>
            <div className={styles.popoverBackdrop} onClick={() => setOpen(false)} />
            <div className={styles.popover}>
              <CalendarDatePicker
                value={date}
                minDate={minDate}
                maxDate={maxDate}
                onChange={(d) => {
                  onChange(d);
                  setOpen(false);
                }}
              />
            </div>
          </>
        )}
      </div>
    </FieldWrapper>
  );
}
