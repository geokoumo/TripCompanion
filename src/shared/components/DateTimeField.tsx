import { useState } from 'react';
import { formatDateShort } from '../lib/dateFormat';
import { CalendarDatePicker } from './CalendarDatePicker';
import { WheelTimePicker } from './WheelTimePicker';
import { FieldWrapper } from './Field';
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

  return (
    <FieldWrapper label={label} caption={caption} error={error}>
      <div className={styles.row}>
        <button type="button" className={styles.pill} data-open={open === 'date'} onClick={() => setOpen(open === 'date' ? null : 'date')}>
          {date ? formatDateShort(date) : 'Επίλεξε ημερομηνία'}
        </button>
        <button type="button" className={styles.pill} data-open={open === 'time'} onClick={() => setOpen(open === 'time' ? null : 'time')}>
          {time || '--:--'}
        </button>
        {open && (
          <>
            <div className={styles.popoverBackdrop} onClick={() => setOpen(null)} />
            <div className={styles.popover}>
              {open === 'date' ? (
                <CalendarDatePicker
                  value={date}
                  minDate={minDate}
                  maxDate={maxDate}
                  onChange={(d) => {
                    onDateChange(d);
                    setOpen(null);
                  }}
                />
              ) : (
                <WheelTimePicker value={time || '00:00'} onChange={onTimeChange} />
              )}
            </div>
          </>
        )}
      </div>
    </FieldWrapper>
  );
}
