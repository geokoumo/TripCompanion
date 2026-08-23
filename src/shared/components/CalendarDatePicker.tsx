import { useState } from 'react';
import styles from './CalendarDatePicker.module.css';

const WEEKDAYS = ['Κυ', 'Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα'];
const MONTHS = [
  'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
  'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος',
];

interface CalendarDatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseYearMonth(value?: string): { year: number; month: number } | null {
  if (!value) return null;
  const [y, m] = value.split('-').map(Number);
  if (!y || !m) return null;
  return { year: y, month: m - 1 };
}

export function CalendarDatePicker({ value, onChange, minDate, maxDate }: CalendarDatePickerProps) {
  const initial = parseYearMonth(value) ?? parseYearMonth(minDate) ?? parseYearMonth(maxDate) ?? (() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  })();
  const [{ year, month }, setViewDate] = useState(initial);
  const todayStr = new Date().toISOString().slice(0, 10);

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // Sunday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { day: number; monthOffset: -1 | 0 | 1 }[] = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, monthOffset: -1 });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, monthOffset: 0 });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length - (startWeekday + daysInMonth) + 1, monthOffset: 1 });
  }

  const goMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setViewDate({ year: next.getFullYear(), month: next.getMonth() });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <button type="button" className={styles.navButton} onClick={() => goMonth(-1)} aria-label="Προηγούμενος μήνας">
          ‹
        </button>
        <span className={styles.headerLabel}>
          {MONTHS[month]} {year}
        </span>
        <button type="button" className={styles.navButton} onClick={() => goMonth(1)} aria-label="Επόμενος μήνας">
          ›
        </button>
      </div>
      <div className={styles.grid}>
        {WEEKDAYS.map((wd) => (
          <div key={wd} className={styles.weekday}>
            {wd}
          </div>
        ))}
        {cells.map((cell, idx) => {
          const cellYear = cell.monthOffset === -1 && month === 0 ? year - 1 : cell.monthOffset === 1 && month === 11 ? year + 1 : year;
          const cellMonth = cell.monthOffset === -1 ? (month === 0 ? 11 : month - 1) : cell.monthOffset === 1 ? (month === 11 ? 0 : month + 1) : month;
          const dateStr = toDateStr(cellYear, cellMonth, cell.day);
          const disabled = (minDate && dateStr < minDate) || (maxDate && dateStr > maxDate);
          return (
            <button
              key={idx}
              type="button"
              className={styles.day}
              data-outside={cell.monthOffset !== 0}
              data-selected={dateStr === value}
              data-today={dateStr === todayStr}
              data-disabled={Boolean(disabled)}
              disabled={Boolean(disabled)}
              onClick={() => onChange(dateStr)}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
