import { useEffect, useRef } from 'react';
import styles from './WheelTimePicker.module.css';

const ITEM_HEIGHT = 36;
const TIME_PRESETS = ['08:00', '12:00', '15:00', '19:30'];

interface WheelColumnProps {
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
  pad?: number;
  disabled?: (value: number) => boolean;
}

function WheelColumn({ values, selected, onSelect, pad = 2, disabled }: WheelColumnProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const index = values.indexOf(selected);
    if (index >= 0) {
      el.scrollTop = index * ITEM_HEIGHT;
    }
  }, [selected, values]);

  const handleScrollEnd = () => {
    const el = ref.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / ITEM_HEIGHT);
    const clamped = Math.min(Math.max(index, 0), values.length - 1);
    const value = values[clamped];
    if (value !== undefined && value !== selected && !disabled?.(value)) {
      onSelect(value);
    }
  };

  return (
    <div
      ref={ref}
      className={styles.column}
      onTouchEnd={handleScrollEnd}
      onMouseUp={handleScrollEnd}
      onWheel={() => setTimeout(handleScrollEnd, 60)}
    >
      <div className={styles.spacer} style={{ height: pad * ITEM_HEIGHT }} />
      {values.map((v) => {
        const isDisabled = disabled?.(v) ?? false;
        return (
          <div
            key={v}
            className={styles.item}
            data-active={v === selected}
            data-disabled={isDisabled}
            onClick={() => {
              if (!isDisabled) onSelect(v);
            }}
          >
            {String(v).padStart(2, '0')}
          </div>
        );
      })}
      <div className={styles.spacer} style={{ height: pad * ITEM_HEIGHT }} />
    </div>
  );
}

interface WheelTimePickerProps {
  value: string; // HH:mm
  onChange: (value: string) => void;
  /** True when a given hour/minute combination falls inside an occupied range (Round 8 hard block). */
  isTimeDisabled?: (hour: number, minute: number) => boolean;
}

export function WheelTimePicker({ value, onChange, isTimeDisabled }: WheelTimePickerProps) {
  const [hourStr, minuteStr] = value.split(':');
  const hour = Number(hourStr ?? 0);
  const rawMinute = Number(minuteStr ?? 0);
  const minute = Math.round(rawMinute / 5) * 5 % 60;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const setHour = (h: number) => onChange(`${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  const setMinute = (m: number) => onChange(`${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

  // An hour is only fully disabled (non-selectable) when every 5-minute slot
  // within it is occupied; a partially-occupied hour stays selectable and
  // instead disables just the conflicting minutes once it's the active hour.
  const isHourDisabled = (h: number) => (isTimeDisabled ? minutes.every((m) => isTimeDisabled(h, m)) : false);
  const isMinuteDisabled = (m: number) => isTimeDisabled?.(hour, m) ?? false;

  return (
    <div>
      <div className={styles.presets}>
        {TIME_PRESETS.map((preset) => (
          <button key={preset} type="button" className={styles.presetChip} onClick={() => onChange(preset)}>
            {preset}
          </button>
        ))}
      </div>
      <div className={styles.wrapper}>
        <WheelColumn values={hours} selected={hour} onSelect={setHour} disabled={isHourDisabled} />
        <span className={styles.separator}>:</span>
        <WheelColumn values={minutes} selected={minute} onSelect={setMinute} disabled={isMinuteDisabled} />
      </div>
    </div>
  );
}
