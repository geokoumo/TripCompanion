import { useState } from 'react';
import { Button } from './Button';
import { WheelTimePicker } from './WheelTimePicker';
import { FieldWrapper } from './Field';
import { Modal } from './Modal';
import styles from './DateTimeField.module.css';

interface TimeFieldProps {
  label: string;
  time: string;
  onChange: (time: string) => void;
  placeholder?: string;
}

/** A single time-only field (no date) — reuses the same wheel picker as DateTimeField's time half. */
export function TimeField({ label, time, onChange, placeholder = '--:--' }: TimeFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <FieldWrapper label={label}>
      <button
        type="button"
        className={styles.pill}
        style={{ width: '100%' }}
        onClick={() => {
          (document.activeElement as HTMLElement | null)?.blur();
          setOpen(true);
        }}
      >
        {time || placeholder}
      </button>
      {open && (
        <Modal
          title={label}
          onClose={() => setOpen(false)}
          footer={
            <Button variant="primary" onClick={() => setOpen(false)}>
              Done
            </Button>
          }
        >
          <WheelTimePicker value={time || '00:00'} onChange={onChange} />
        </Modal>
      )}
    </FieldWrapper>
  );
}
