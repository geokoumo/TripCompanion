const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

/** Full weekday name, e.g. "Thursday" — always computed from the actual date, never hardcoded. */
export function weekdayFull(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return WEEKDAY_FULL[date.getDay()] ?? '';
}

/** Formats "YYYY-MM-DD" as "Thursday · 8 October" — full weekday and month name, no year. */
export function formatDateLong(dateStr: string): string {
  const [, month, day] = dateStr.split('-').map(Number);
  if (!month || !day) return dateStr;
  return `${weekdayFull(dateStr)} · ${day} ${FULL_MONTHS[month - 1]}`;
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

/** "HH:mm" for the current instant — paired with todayStr() to compare against saved date+time fields, same UTC-based convention as todayStr(). */
export function nowTimeStr(): string {
  return new Date().toISOString().slice(11, 16);
}
