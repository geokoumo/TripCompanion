const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Formats "YYYY-MM-DD" as "5 Sep 2026". */
export function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  return `${day} ${SHORT_MONTHS[month - 1]} ${year}`;
}

/** Formats "YYYY-MM-DD" without the year, e.g. "5 Sep". */
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
