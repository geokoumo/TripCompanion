const SHORT_MONTHS = [
  'Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μάι', 'Ιούν', 'Ιούλ', 'Αύγ', 'Σεπ', 'Οκτ', 'Νοέ', 'Δεκ',
];

const WEEKDAY_SHORT = ['Κυ', 'Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα'];

/** Formats "YYYY-MM-DD" as "5 Σεπ 2026". */
export function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  return `${day} ${SHORT_MONTHS[month - 1]} ${year}`;
}

/** Formats "YYYY-MM-DD" without the year, e.g. "5 Σεπ". */
export function formatDateNoYear(dateStr: string): string {
  const [, month, day] = dateStr.split('-').map(Number);
  if (!month || !day) return dateStr;
  return `${day} ${SHORT_MONTHS[month - 1]}`;
}

export function weekdayShort(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return WEEKDAY_SHORT[date.getDay()] ?? '';
}

export function dayNumber(dateStr: string): number {
  return Number(dateStr.split('-')[2] ?? 0);
}

export function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(`${fromDateStr}T00:00:00`).getTime();
  const to = new Date(`${toDateStr}T00:00:00`).getTime();
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
