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
  /** e.g. "Hour" / "Minute" — gives each value's accessible name context beyond the bare number. */
  unitLabel: string;
}

function WheelColumn({ values, selected, onSelect, pad = 2, disabled, unitLabel }: WheelColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);
  const scrollTimer = useRef<number | undefined>(undefined);
  // Refs so the scroll/scrollend listeners (bound once) always read the
  // latest props instead of whatever was current when they were attached.
  const valuesRef = useRef(values);
  const selectedRef = useRef(selected);
  const disabledRef = useRef(disabled);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    valuesRef.current = values;
    selectedRef.current = selected;
    disabledRef.current = disabled;
    onSelectRef.current = onSelect;
  });

  // Keeps the column in sync when `selected` changes from OUTSIDE its own
  // scroll gesture (a preset tap, or the value it opens with) — skipped
  // when the column is already resting at that position, which is exactly
  // the case right after the user's own scroll just produced this value.
  // Forcing scrollTop there was the bug: it cut off the browser's native
  // momentum/snap deceleration mid-flight with an instant jump, which is
  // what made scrolling feel rough instead of smooth.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const index = values.indexOf(selected);
    if (index < 0) return;
    const target = index * ITEM_HEIGHT;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTo({ top: target, behavior: hasMounted.current && !prefersReducedMotion ? 'smooth' : 'auto' });
    }
    hasMounted.current = true;
  }, [selected, values]);

  // Committing on `scrollend` (when supported) reflects the value once the
  // browser's own momentum/snap animation has actually finished, rather
  // than at touchend/mouseup — momentum scrolling continues well after the
  // finger lifts, so reading the position right then was capturing a
  // mid-flight value, not the settled one. The debounced `scroll` listener
  // is a fallback for browsers without scrollend.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const commit = () => {
      const index = Math.round(el.scrollTop / ITEM_HEIGHT);
      const clamped = Math.min(Math.max(index, 0), valuesRef.current.length - 1);
      const value = valuesRef.current[clamped];
      if (value !== undefined && value !== selectedRef.current && !disabledRef.current?.(value)) {
        onSelectRef.current(value);
      }
    };

    const onScroll = () => {
      window.clearTimeout(scrollTimer.current);
      scrollTimer.current = window.setTimeout(commit, 120);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scrollend', commit);
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', commit);
      window.clearTimeout(scrollTimer.current);
    };
  }, []);

  return (
    <div ref={ref} className={styles.column} role="listbox" aria-label={unitLabel}>
      <div className={styles.spacer} style={{ height: pad * ITEM_HEIGHT }} aria-hidden="true" />
      {values.map((v) => {
        const isDisabled = disabled?.(v) ?? false;
        const isActive = v === selected;
        return (
          <button
            key={v}
            type="button"
            className={styles.item}
            role="option"
            aria-selected={isActive}
            aria-label={`${unitLabel} ${String(v).padStart(2, '0')}`}
            data-active={isActive}
            data-disabled={isDisabled}
            disabled={isDisabled}
            onClick={() => onSelect(v)}
          >
            {String(v).padStart(2, '0')}
          </button>
        );
      })}
      <div className={styles.spacer} style={{ height: pad * ITEM_HEIGHT }} aria-hidden="true" />
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
        <WheelColumn values={hours} selected={hour} onSelect={setHour} disabled={isHourDisabled} unitLabel="Hour" />
        <span className={styles.separator} aria-hidden="true">
          :
        </span>
        <WheelColumn values={minutes} selected={minute} onSelect={setMinute} disabled={isMinuteDisabled} unitLabel="Minute" />
      </div>
    </div>
  );
}
